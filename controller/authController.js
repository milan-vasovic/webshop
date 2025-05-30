import {validationResult} from 'express-validator';
import sanitize from 'mongo-sanitize';
import mongoose from 'mongoose';

import UserService from '../service/userService.js';

/**
 * Renders the registration page.
 */
async function getRegistrationPage(req, res, next) {
    try {
        return res.render("auth/register", {
            path: "/registracija",
            pageTitle: "Registrujte Se",
            pageDescription: "Registrujte se na našu prodavnicu i olakšano pratite i poručujte",
            pageKeyWords: "Registracija, Webshop, Prodavnica, Odeća",
            index: true,
            featureImage: undefined,
            existingData: null,
            errorMessage: ""
          });
          
    } catch (error) {
        next(error);
    }
}

/**
 * Renders the login page.
 */
async function getLoginPage(req, res, next) {
    try {
        if (res.locals.role !== 'guest') {
            return res.redirect('/');
        }

        const redirectUrl = req.query.redirectTo || '/moj-profil';

        return res.render("auth/login", {
            path: "/prijava",
            pageTitle: "Prijavite Se",
            pageDescription: "Prijavite se na našu prodavnicu i olakšano pratite i poručujte",
            pageKeyWords: "Prijava, Webshop, Prodavnica, Odeća",
            index: true,
            featureImage: undefined,
            existingData: null,
            errorMessage: "",
            redirectTo: redirectUrl,
            showRequestNewActivation: false
          });
          
    } catch (error) {
        next(error);
    }
}

/**
 * Renders the new password page.
 */
async function getNewPasswordPage(req, res, next) {
    try {
        let existingData = req.existingData;

        if (!existingData) {
            existingData = ""
        }

        return res.render("auth/get-new-password", {
            path: "/zatrazite-promenu-sifre",
            pageTitle: "Zatražite Novu Šifru",
            pageDescription: "Stranica za traženje nove šifre",
            pageKeyWords: "Zatražite Novu Šifru, Nova Šifra, Promena",
            index: false,
            featureImage: undefined,
            existingData: existingData,
            errorMessage: ""
          });          
    } catch (error) {
        next(error);
    }
}

/**
 * Renders the set new password page.
 */
async function getSetNewPasswordPage(req, res, next) {
    try {
        const token = req.params.token;

        const user = await UserService.validateResetToken(token);

        return res.render("auth/set-new-password", {
            path: "/nova-sifra",
            pageTitle: "Postavite Novu Šifru",
            pageDescription: "Stranica za postavljanje nove šifre",
            pageKeyWords: "Nova Šifra, Postavljanje, Upravljanje",
            index: false,
            featureImage: undefined,
            errorMessage: "",
            userId: user._id.toString(),
            passwordToken: token
          });          
    } catch (error) {
        next(error);
    }
}

async function getConfirmAccountPage(req, res, next) {
    try {
        const { token } = req.query;

        const result = await UserService.confirmAccount(token);

        return res.render("email/success", {
            path: "/auth/confirm",
            pageTitle: "Nalog potvrđen",
            pageDescription: "Potvrda email adrese korisničkog naloga",
            pageKeyWords: "Email potvrda, Aktivacija naloga, Potvrda registracije",
            index: false,
            featureImage: undefined,
            message: result.message
          });
          
    } catch (error) {
        next(error);
    }
}

async function getActivationAccount(req, res, next) {
    try {
        let existingData = req.existingData;

        if (!existingData) {
            existingData = ""
        }

        return res.render("auth/get-activation", {
            path: "/zatrazite-aktivaciju",
            pageTitle: "Zatražite Aktivaciju Naloga",
            pageDescription: "Stranica za ponovno slanje aktivacionog linka korisnicima koji nisu aktivirali nalog.",
            pageKeyWords: "Zatražite novu aktivaciju, Aktivacija naloga, Email aktivacija",
            existingData: existingData,
            errorMessage: "",
            index: false,
            featureImage: undefined
          });
          
    } catch (error) {
        next(error);
    }
}

/**
 * Handles the login form submission.
 */
async function postLogin(req, res, next) {
    try {
        const email = sanitize(req.body.email);
        const password = sanitize(req.body.password);
        const redirectUrl = sanitize(req.body.redirectTo) || '/moj-profil';

        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.render("auth/login", {
                path: "/prijava",
                pageTitle: "Prijavite Se",
                pageDescription: "Prijavite se na našu prodavnicu i olakšano pratite i poručujte. Iskoristite sve pogodnosti korisničkog naloga.",
                pageKeyWords: "Prijava, Webshop, Prodavnica, Odeća, TopHelanke, Online Kupovina",
                existingData: {
                  email: email
                },
                errorMessage: errors.array()[0].msg,
                redirectTo: redirectUrl,
                showRequestNewActivation: false,
                index: true,
                featureImage: undefined
              });
              
        }

        const userExist = await UserService.validateUserInfo(email, password);

        if(!userExist.success) {
            let showRequestNewActivation = false;
            if (userExist.show) showRequestNewActivation = true;

            return res.render("auth/login", {
                path: "/prijava",
                pageTitle: "Prijavite Se",
                pageDescription: "Prijavite se na našu prodavnicu i olakšano pratite i poručujte",
                pageKeyWords: "Prijava, Webshop, Prodavnica, Odeća",
                existingData: {
                    email: email
                },
                errorMessage: userExist.message || "Nije moguće naći korisnika!",
                showRequestNewActivation: showRequestNewActivation,
                redirectTo: redirectUrl,
                index: true,
                featureImage: undefined
            })
        }

        const sessionCart = req.session.cart;
        if (sessionCart) {
            await UserService.updateCartWithSessionCart(userExist._id, sessionCart);
        }

        const user = await UserService.findUserForSession(userExist._id);

        if (user) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.guest = false;

            res.redirect(redirectUrl);
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Handles the registration form submission.
 */
async function postRegister(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const email = sanitize(req.body.email);
      const password = sanitize(req.body.password);
      const firstname = sanitize(req.body.firstname);
      const lastname = sanitize(req.body.lastname);
  
      const errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        return res.render("auth/register", {
          path: "/registracija",
          pageTitle: "Registrujte Se",
          pageDescription: "Registrujte se na našu prodavnicu i olakšano pratite i poručujte",
          pageKeyWords: "Registracija, Webshop, Prodavnica, Odeća",
          existingData: {
            email: email,
            firstname: firstname,
            lastname: lastname,
            acceptance: req.body.acceptance,
          },
          errorMessage: errors.array()[0].msg,
          index: true,
          featureImage: undefined
        });
      }
  
      const newUser = await UserService.registerNewUser(
        email,
        password,
        firstname,
        lastname,
        null,
        null,
        session
      );
  
      if (newUser.status === false) {
        return res.render("auth/register", {
            path: "/registracija",
            pageTitle: "Registrujte Se",
            pageDescription: "Registrujte se na našu prodavnicu i olakšano pratite i poručujte",
            pageKeyWords: "Registracija, Webshop, Prodavnica, Odeća",
            existingData: {
              email: email,
              firstname: firstname,
              lastname: lastname,
              acceptance: req.body.acceptance,
            },
            errorMessage: newUser.message || "Greška prilikom registracije!",
            index: true,
            featureImage: undefined
          });
      }

      await session.commitTransaction();
  
      return res.render("email/success", {
        path: "/uspesna-registracija",
        pageTitle: "Uspešno Završena Registracija",
        pageDescription: "Stranica koja informiše korisnika o uspešno zatraženoj registraciji",
        pageKeyWords: "Uspeh, Uspešno, Registracija Naloga",
        message:
          "Uspešno ste završili registraciju Vašeg naloga, pogledajte Vaš email za AKTIVACIJU naloga i dalja uputstva!",
        index: false,
        featureImage: undefined
      });
    } catch (error) {
        console.log(error);
      await session.abortTransaction();
      return next(error);
    } finally {
      session.endSession();
    }
  }
  

/**
 * Handles the request for a new password.
 * Try to validate does user exist and send email with token to user email
 */
async function postRequestNewPassword(req, res, next) {
    try {
        const email = sanitize(req.body.email);
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render("auth/get-new-password", {
                path: "/zatrazite-promenu-sifre",
                pageTitle: "Zatražite Novu Šifru",
                pageDescription: "Stranica za traženje nove šifre",
                pageKeyWords: "Zatražite Novu Šifru, Nova Šifra, Promena",
                existingData: { email: email },
                errorMessage: errors.array()[0].msg,
                index: false,
                featureImage: undefined
            });
        }

        const result = await UserService.validateUserAndSendResetToken(email);

        if (!result.status) {
            return res.render("auth/get-new-password", {
                path: "/zatrazite-promenu-sifre",
                pageTitle: "Zatražite Novu Šifru",
                pageDescription: "Stranica za traženje nove šifre",
                pageKeyWords: "Zatražite Novu Šifru, Nova Šifra, Promena",
                existingData: { email: email },
                errorMessage: result.msg || "Došlo je do greške!",
                index: false,
                featureImage: undefined
            });
        }

        return res.render("email/success", {
            path: "/uspesno-zatrazena-nova-sifra",
            pageTitle: "Uspešno Zatražena Nova Šifra",
            pageDescription: "Stranica koja informiše korisnika o uspešno zatraženoj novoj lozinci",
            pageKeyWords: "Uspeh, Uspešno, Promena Šifre",
            message: "Uspešno ste zatražili promenu Vaše lozinke, pogledajte Vaš email za dalja uputstva!",
            index: false,
            featureImage: undefined
        });
    } catch (error) {
        next(error);
    }
}

async function postRequestActivation(req, res, next) {
    try {
        const email = sanitize(req.body.email);
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render("auth/get-activation", {
                path: "/zatrazite-aktivaciju",
                pageTitle: "Zatražite Aktivaciju Naloga",
                pageDescription: "Stranica za traženje nove aktivacije",
                pageKeyWords: "Zatražite Novu Aktivaciju, Nova Aktivacija",
                existingData: { email: email },
                errorMessage: errors.array()[0].msg,
                index: false,
                featureImage: undefined
            });
        }

        const result = await UserService.validateUserAndSendConfirmationAcount(email);

        if (!result.success) {
            return res.render("auth/get-activation", {
                path: "/zatrazite-aktivaciju",
                pageTitle: "Zatražite Aktivaciju Naloga",
                pageDescription: "Stranica za traženje nove aktivacije",
                pageKeyWords: "Zatražite Novu Aktivaciju, Nova Aktivacija",
                existingData: { email: email },
                errorMessage: result.message || "Došlo je do greške!",
                index: false,
                featureImage: undefined
            });
        }

        return res.render("email/success", {
            path: "/uspesno-zatrazena-aktivacija",
            pageTitle: "Uspešno Zatražena Aktivacija",
            pageDescription: "Stranica koja informiše korisnika o uspešno zatraženoj aktivaciji",
            pageKeyWords: "Uspeh, Uspešno, Aktivacija Naloga",
            message: "Uspešno ste zatražili aktivaciju Vašeg naloga, pogledajte Vaš email za dalja uputstva!",
            index: false,
            featureImage: undefined
        });
    } catch (error) {
        next(error);
    }
}

async function postSetNewPassword(req, res, next) {
    try {
        const newPassword = sanitize(req.body.password);
        const userId = sanitize(req.body.userId);
        const passwordToken = sanitize(req.body.passwordToken);

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('auth/set-new-password', {
                path: "/nova-sifra",
                pageTitle: "Postavite Novu Šifru",
                pageDescription: "Stranica za postavljanje nove sifre",
                pageKeyWords: "Nova Sifra, Postavljanje, Upravljanje",
                errorMessage: errors.array()[0].msg,
                userId: userId,
                passwordToken: passwordToken,
                index: false,
                featureImage: undefined
            });
        }

        const email = await UserService.updateUserPassword(userId, newPassword, passwordToken);

        return res.render("auth/login", {
            path: "/prijava",
            pageTitle: "Prijavite Se",
            pageDescription: "Prijavite se na našu prodavnicu i olakšano pratite i poručujte",
            pageKeyWords: "Prijava, Webshop, Prodavnica, Odeća",
            existingData: {
                email: email,
            },
            errorMessage: "",
            redirectTo: "",
            index: true,
            featureImage: undefined
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Handles the logout action, and destroy user sassion
 */
function postLogout(req, res, next) {
    try {
        req.session.destroy(() => {
            res.redirect("/");
        });
    } catch (error) {
        next(error);
    }
}

export default {
    getRegistrationPage,
    getLoginPage,
    getNewPasswordPage,
    getSetNewPasswordPage,
    getConfirmAccountPage,
    getActivationAccount,
    postRegister,
    postLogin,
    postRequestNewPassword,
    postRequestActivation,
    postSetNewPassword,
    postLogout
}