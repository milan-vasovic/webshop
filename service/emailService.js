import nodemailer from 'nodemailer';

import PDFService from './pdfService.js';

import ErrorHelper from '../helper/errorHelper.js';
import ItemService from './itemService.js';

let transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_AUTH_USER,
        pass: process.env.EMAIL_AUTH_PASS,
    },
});

const styles = {
    bodyFontFamily: "'Verdana', Helvetica, Arial, sans-serif",
    bodyBackground: "#f4f4f4",
    containerBackground: "#ffffff",
    containerPadding: "20px",
    containerBorderRadius: "8px",
    containerBoxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    headingColor: "#01b3e9",
    headingMarginBottom: "20px",
    textColor: "#333333",
    textFontSize: "16px",
    textMarginBottom: "30px",
    buttonPadding: "12px 24px",
    buttonBackground: "#01b3e9",
    buttonTextColor: "#fff",
    buttonBorderRadius: "4px",
    buttonFontSize: "16px",
    buttonTransition: "background-color 0.3s"
};

class EmailService {
    static async sendNewContactNotification(name, email,contactId) {
        const mailOptions = {
            from: "Tophelanke",
            to: process.env.EMAIL_ADMIN,
            subject: "Dobliste novi upit!",
            text: "Imate novi upit iz kontakt forme",
            html: `
                <html lang="sr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Novi upit!</title>
                </head>
                <body style="font-family: ${ styles.bodyFontFamily }; background-color: ${  styles.bodyBackground }; text-align: center; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: ${  styles.containerBackground }; padding: ${  styles.containerPadding }; border-radius: ${  styles.containerBorderRadius }; box-shadow: ${  styles.containerBoxShadow };">
                    <h1 style="color: ${  styles.headingColor }; margin-bottom: 20px;">Novi upit!</h1>
                    <h2 style="color: ${  styles.h2Color }; margin-bottom: ${  styles.h2MarginBottom };">
                        Imate novi upit od ${  name } (Email: ${  email })
                    </h2>
                    <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">
                        Prijavite se u administraciju kako biste pregledali upit.
                    </p>
                    <a href="${ process.env.BASE_URL}${ process.env.PORT }/admin/kontakt-detalji/${ contactId }" 
                        style="display: inline-block; padding: ${  styles.buttonPadding }; background-color: ${  styles.buttonBackground }; color: ${  styles.buttonTextColor }; text-decoration: none; border-radius: ${  styles.buttonBorderRadius }; font-size: ${  styles.buttonFontSize }; transition: ${  styles.buttonTransition };">
                        Pogledajte upit
                    </a>
                    </div>
                </body>
                </html>
            `,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                throw new Error("Nije moguće poslati email!");
            }
        });
    }

    static async sendConfirmAccount(email, token, session = null) {
        try {
            const confirmUrl = `${ process.env.BASE_URL}/auth/confirm?token=${token}`;

            const mailOptions = {
                from: "Tophelanke <no-reply@tophelanke.com>",
                to: email,
                subject: "Potvrdite vašu registraciju",
                html: `
                    <html lang="sr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Potvrda registracije</title>
                    </head>
                    <body style="font-family: ${styles.bodyFontFamily}; background-color: ${styles.bodyBackground}; text-align: center; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: ${styles.containerBackground}; padding: ${styles.containerPadding}; border-radius: ${styles.containerBorderRadius}; box-shadow: ${styles.containerBoxShadow};">
                            <h1 style="color: ${styles.headingColor}; margin-bottom: ${styles.headingMarginBottom};">Dobrodošli u Tophelanke!</h1>
                            <p style="color: ${styles.textColor}; font-size: ${styles.textFontSize}; margin-bottom: ${styles.textMarginBottom};">
                                Kliknite na dugme ispod kako biste potvrdili vašu registraciju.
                            </p>
                            <a href="${confirmUrl}" 
                                style="display: inline-block; padding: ${styles.buttonPadding}; background-color: ${styles.buttonBackground}; color: ${styles.buttonTextColor}; text-decoration: none; border-radius: ${styles.buttonBorderRadius}; font-size: ${styles.buttonFontSize}; transition: ${styles.buttonTransition};">
                                Potvrdite nalog
                            </a>
                            <p style="color: ${styles.textColor}; font-size: ${styles.textFontSize}; margin-top: 20px;">
                                Ako niste vi inicirali ovu registraciju, možete zanemariti ovaj email.
                            </p>
                        </div>
                    </body>
                    </html>
                `,
            };

            // Pošalji email
            let info = await transporter.sendMail(mailOptions);
            if (!info) {
                console.error("❌ Email nije poslat:");
                return false;
            }

            console.log(`✅ Email za potvrdu poslat`);
            return true; // Ako je email uspešno poslat
        } catch (error) {
            console.error("❌ Greška prilikom slanja emaila");
            return false; // Ako email nije poslat
        }
    }

    static async sendOrderConfirmation(name, email, token) {
        try {
            const confirmUrl = `${ process.env.BASE_URL}/prodavnica/potvrdite-porudzbinu?token=${token}`;

            const mailOptions = {
                from: "Tophelanke <no-reply@tophelanke.com>",
                to: email,
                subject: "Potvrdite vašu porudžbinu",
                html: `
                    <html lang="sr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Potvrda porudžbine</title>
                    </head>
                    <body style="font-family: ${styles.bodyFontFamily}; background-color: ${styles.bodyBackground}; text-align: center; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: ${styles.containerBackground}; padding: ${styles.containerPadding}; border-radius: ${styles.containerBorderRadius}; box-shadow: ${styles.containerBoxShadow};">
                            <h1 style="color: ${styles.headingColor}; margin-bottom: ${styles.headingMarginBottom};">Dobrodošli u Tophelanke!</h1>
                            <p style="color: ${styles.textColor}; font-size: ${styles.textFontSize}; margin-bottom: ${styles.textMarginBottom};">
                                Kliknite na dugme ispod kako biste potvrdili vašu porudžbinu.
                            </p>
                            <a href="${confirmUrl}" 
                                style="display: inline-block; padding: ${styles.buttonPadding}; background-color: ${styles.buttonBackground}; color: ${styles.buttonTextColor}; text-decoration: none; border-radius: ${styles.buttonBorderRadius}; font-size: ${styles.buttonFontSize}; transition: ${styles.buttonTransition};">
                                Potvrdite Porudžbinu
                            </a>
                            <p style="color: ${styles.textColor}; font-size: ${styles.textFontSize}; margin-top: 20px;">
                                Ako niste vi inicirali ovu porudžbinu, možete zanemariti ovaj email.
                            </p>
                        </div>
                    </body>
                    </html>
                `,
            };

            // Pošalji email
            let info = await transporter.sendMail(mailOptions);
            if (!info) {
                console.error("❌ Email nije poslat:");
                return false;
            }

            console.log(`✅ Email za potvrdu poslat`);
            return true; // Ako je email uspešno poslat
        } catch (error) {
            console.error("❌ Greška prilikom slanja emaila");
            return false; // Ako email nije poslat
        }
    }
    static async sendOrderInfo(name, email, orderInfo) {
        try {
            const itemsInfo = orderInfo.items.map(item => ({
                Naziv: item.title,
                Velicina: item.size,
                Boja: item.color,
                Količina: item.amount,
                Cena: item.price
              }));
          
              const newDate = orderInfo.date.toLocaleDateString('sr-RS', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
          
              const newOrderInfo = {
                'Broj Porudžbine': orderInfo._id,
                Artikli: itemsInfo,
                Datum: newDate,
                Poštarina: `${orderInfo.shipping} RSD`,
                Kupon: orderInfo.coupon 
                         ? `Kod: ${orderInfo.coupon?.code || 'nema'} | Popust: ${orderInfo.coupon?.discount || 'nema'} %` 
                         : "Nema kupona",
                Cena: orderInfo.coupon ? `Ukupna cena sa poštarinom i kuponom: ${orderInfo.totalPrice} RSD` : `Ukupna cena sa poštarinom: ${orderInfo.totalPrice} RSD`
              };
          
              // Generiši PDF kao Buffer
              const pdfBuffer = await PDFService.generatePDF(newOrderInfo);

              const mailOptions = {
                from: 'Tophelanke',
                to: email,
                subject: 'Potvrda Porudžbine',
                text: `Poštovani/a ${name}, molimo pogledajte potvrdu porudžbine u prilogu.`,
                attachments: [
                  {
                    filename: 'potvrda_porudzbine.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                  }
                ]
              };
          
              // Pošalji email
                transporter.sendMail(mailOptions);
        } catch (error) {
            console.log("Email nije poslat");
        }
    }

    static async sendResetTokenToUser(user) {
        try {    
            const mailOptions = {
                from: "Tophelanke",
                to: user.email,
                subject: `Poštovani/a ${user.firstName}, zatražili ste promenu lozinke`,
                text: "Ukoliko ste zatražili promenu lozinke, pratite instrukcije unutar ovog email.",
                html: `<html lang="sr">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Restartovanje šifre</title>
                        </head>
                        <body style="font-family: ${  styles.bodyFontFamily }; background-color: ${  styles.bodyBackground }; text-align: center; padding: 20px;">
                            <div style="max-width: 600px; margin: 0 auto; background-color: ${  styles.containerBackground }; padding: ${  styles.containerPadding }; border-radius: ${  styles.containerBorderRadius }; box-shadow: ${  styles.containerBoxShadow };">
                            <h1 style="color: ${  styles.headingColor }; margin-bottom: ${  styles.headingMarginBottom };">Restartujte šifru</h1>
                            <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">
                                Pozdrav <strong>${  user.firstName }</strong>,
                            </p>
                            <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">
                                Zatražili ste restartovanje šifre. Kliknite na link ispod da biste kreirali novu šifru:
                            </p>
                            <a href="${ process.env.BASE_URL}/napravite-novu-sifru/${  user.resetToken }" 
                                style="display: inline-block; padding: ${  styles.buttonPadding }; background-color: ${  styles.buttonBackground }; color: ${  styles.buttonTextColor }; text-decoration: none; border-radius: ${  styles.buttonBorderRadius }; font-size: ${  styles.buttonFontSize }; transition: ${  styles.buttonTransition };">
                                Restartujte šifru
                            </a>
                            <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-top: 30px;">
                                Ako niste zatražili restartovanje šifre, ignorišite ovaj email.
                            </p>
                            </div>
                        </body>
                        </html>
                    `
            };
    
            const info = await transporter.sendMail(mailOptions);
    
            if (!info.messageId) {
                ErrorHelper.throwEmailError();
            }
    
            return true;
        } catch (error) {
            return false;
        }
    }
    
    //Send email to notify that item is backorderd
    static async sendItemBackordered(itemId, variationId) {
        try {
            
        } catch (error) {
            console.log("Nije moguće poslati email!");
        }
    }

    //Send email to notify that item is backorderd
    static async notifyUsersFromItemWishlist(itemId) {
        try {
            const item = await ItemService.findUsersFromWishlist(itemId)
    
            await Promise.all(
                item.wishlist.map(async (wishlistEntry) => {
                    if (wishlistEntry.userId) {
                        const email = wishlistEntry.userId.email;
                        const name = wishlistEntry.userId.firstName;
    
                        const mailOptions = {
                            from: "Tophelanke",
                            to: email,
                            subject: `Poštovani/a ${ name || 'Korisniče/ce'}, Artikal ${item.title} je sada na akciji`,
                            text: "Na našoj aplikaciji trenutno je Vaš željeni artiakl na akciji!",
                            html: `<html lang="sr">
                                    <head>
                                        <meta charset="UTF-8">
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        <title>${  item.title } je sada na akciji!</title>
                                    </head>
                                    <body style="font-family: ${  styles.bodyFontFamily }; background-color: ${  styles.bodyBackground }; text-align: center; padding: 20px;">
                                        <div style="max-width: 600px; margin: 0 auto; background-color: ${  styles.containerBackground }; padding: ${  styles.containerPadding }; border-radius: ${  styles.containerBorderRadius }; box-shadow: ${  styles.containerBoxShadow };">
                                        <h1 style="color: ${  styles.headingColor }; margin-bottom: ${  styles.headingMarginBottom };">Vaš željeni artikal je sada na akciji!</h1>
                                        <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">Pozdrav ${  name },</p>
                                        <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">
                                            Klikom na link možete proveriti akciju na artiklu <strong>${  item.title }</strong>:
                                        </p>
                                        <a href="${ process.env.BASE_URL}/prodavnica/artikal/${  encodeURIComponent(item.title) }" 
                                            style="display: inline-block; padding: ${  styles.buttonPadding }; background-color: ${  styles.buttonBackground }; color: ${  styles.buttonTextColor }; text-decoration: none; border-radius: ${  styles.buttonBorderRadius }; font-size: ${  styles.buttonFontSize }; transition: ${  styles.buttonTransition };">
                                            Pogledajte
                                        </a>
                                        </div>
                                    </body>
                                    </html>
                                    `
                        };
                
                        const info = await transporter.sendMail(mailOptions);
                
                        if (!info.messageId) {
                            ErrorHelper.throwEmailError();
                        }

                    }
                })
            );
    
            console.log("Email notifikacije su poslate korisnicima koji imaju artikal u wishlisti.");
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }
    
    static async notifyUserThatOrderIsSent(name, email, orderInfo) {
        const mailOptions = {
            from: "Tophelanke",
            to: email,
            subject: `Poštovani/a ${ name || 'Korisniče/ce'}, Vaša prudžbina: ${orderInfo} je poslata`,
            text: "Na našoj aplikaciji možete pratiti status Vaše porudžbine!",
            html: `<html lang="sr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Porudžbina: ${  orderInfo } je poslata</title>
                    </head>
                    <body style="font-family: ${  styles.bodyFontFamily }; background-color: ${  styles.bodyBackground }; text-align: center; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: ${  styles.containerBackground }; padding: ${  styles.containerPadding }; border-radius: ${  styles.containerBorderRadius }; box-shadow: ${  styles.containerBoxShadow };">
                        <h1 style="color: ${  styles.headingColor }; margin-bottom: ${  styles.headingMarginBottom };">Porudžbina je poslata!</h1>
                        <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">Pozdrav ${  name },</p>
                        <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">
                            Klikom na link možete proveriti status vaše porudžbine:
                        </p>
                        <a href="${ process.env.BASE_URL}/korisnik/porudzbina-detalji/${  orderInfo }" 
                            style="display: inline-block; padding: ${  styles.buttonPadding }; background-color: ${  styles.buttonBackground }; color: ${  styles.buttonTextColor }; text-decoration: none; border-radius: ${  styles.buttonBorderRadius }; font-size: ${  styles.buttonFontSize }; transition: ${  styles.buttonTransition };">
                            Pogledajte
                        </a>
                        </div>
                    </body>
                    </html>
                    `
        };

        const info = await transporter.sendMail(mailOptions);

        if (!info.messageId) {
            ErrorHelper.throwEmailError();
        }
    }

    static async notifyUserThatOrderIsReturned(name, email, orderInfo) {
        const mailOptions = {
            from: "Tophelanke",
            to: email,
            subject: `Poštovani/a ${ name || 'Korisniče/ce'}, Vaša prudžbina: ${orderInfo} je vraćena`,
            text: "Na našoj aplikaciji možete pratiti status Vaše porudžbine!",
            html: `<html lang="sr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Porudžbina: ${  orderInfo } je vraćena</title>
                    </head>
                    <body style="font-family: ${  styles.bodyFontFamily }; background-color: ${  styles.bodyBackground }; text-align: center; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: ${  styles.containerBackground }; padding: ${  styles.containerPadding }; border-radius: ${  styles.containerBorderRadius }; box-shadow: ${  styles.containerBoxShadow };">
                        <h1 style="color: ${  styles.headingColor }; margin-bottom: ${  styles.headingMarginBottom };">Porudžbina je vraćena!</h1>
                        <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">
                            Pozdrav ${  name },
                        </p>
                        <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">
                            Ako imate nalog, klikom na link možete proveriti status vaše porudžbine, u suprotnom registrujte se koristeći ovu email adresu:
                        </p>
                        <a href="${ process.env.BASE_URL}/korisnik/porudzbina-detalji/${  orderInfo }" 
                            style="display: inline-block; padding: ${  styles.buttonPadding }; background-color: ${  styles.buttonBackground }; color: ${  styles.buttonTextColor }; text-decoration: none; border-radius: ${  styles.buttonBorderRadius }; font-size: ${  styles.buttonFontSize }; transition: ${  styles.buttonTransition };">
                            Pogledajte
                        </a>
                        </div>
                    </body>
                    </html>
                    `
        };

        const info = await transporter.sendMail(mailOptions);

        if (!info.messageId) {
            ErrorHelper.throwEmailError();
        }
    }

    static async notifyUserThatOrderIsCancelled(name, email, orderInfo) {
        const mailOptions = {
            from: "Tophelanke",
            to: email,
            subject: `Poštovani/a ${ name || 'Korisniče/ce'}, Vaša prudžbina: ${orderInfo} je otkazana`,
            text: "Na našoj aplikaciji možete pratiti status Vaše porudžbine!",
            html: `<html lang="sr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Porudžbina: ${  orderInfo } je otkazana!</title>
                    </head>
                    <body style="font-family: ${  styles.bodyFontFamily }; background-color: ${  styles.bodyBackground }; text-align: center; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: ${  styles.containerBackground }; padding: ${  styles.containerPadding }; border-radius: ${  styles.containerBorderRadius }; box-shadow: ${  styles.containerBoxShadow };">
                        <h1 style="color: ${  styles.headingColor }; margin-bottom: ${  styles.headingMarginBottom };">Porudžbina je otkazana!</h1>
                        <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">
                            Poštovani/a ${  name || "Korisniče/ce" }, vaša porudžbina: <strong>${  orderInfo }</strong> je otkazana!
                        </p>
                        <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">
                            Ako imate nalog, klikom na link možete proveriti status vaše porudžbine, u suprotnom registrujte se koristeći ovu email adresu:
                        </p>
                        <a href="${ process.env.BASE_URL}/korisnik/porudzbina-detalji/${  orderInfo }" 
                            style="display: inline-block; padding: ${  styles.buttonPadding }; background-color: ${  styles.buttonBackground }; color: ${  styles.buttonTextColor }; text-decoration: none; border-radius: ${  styles.buttonBorderRadius }; font-size: ${  styles.buttonFontSize }; transition: ${  styles.buttonTransition };">
                            Pogledajte
                        </a>
                        </div>
                    </body>
                    </html>
                    `
        };

        const info = await transporter.sendMail(mailOptions);

        if (!info.messageId) {
            ErrorHelper.throwEmailError();
        }

        await this.notifyAdminThatOrderIsCancelled(name, email, orderInfo);
    }

    static async notifyAdminThatOrderIsCancelled(name, email, orderInfo) {
        const mailOptions = {
            from: "Tophelanke",
            to: process.env.EMAIL_ADMIN,
            subject: `Prudžbina: ${orderInfo} je otkazana`,
            text: `Porudžbina od strane: ${name} na email: ${email} je otkazana!`,
            html: `<html lang="sr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Porudžbina: ${  orderInfo } je otkazana!</title>
                    </head>
                    <body style="font-family: ${  styles.bodyFontFamily }; background-color: ${  styles.bodyBackground }; text-align: center; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: ${  styles.containerBackground }; padding: ${  styles.containerPadding }; border-radius: ${  styles.containerBorderRadius }; box-shadow: ${  styles.containerBoxShadow };">
                        <h1 style="color: ${  styles.headingColor }; margin-bottom: ${  styles.headingMarginBottom };">Porudžbina je otkazana!</h1>
                        <p style="color: ${  styles.textColor }; font-size: ${  styles.textFontSize }; margin-bottom: ${  styles.textMarginBottom };">
                            Porudžbina od strane: <strong>${  name }</strong> na email: <strong>${  email }</strong> je otkazana!
                        </p>
                        <a href="${ process.env.BASE_URL}/admin/porudzbina-detalji/${  orderInfo }" 
                            style="display: inline-block; padding: ${  styles.buttonPadding }; background-color: ${  styles.buttonBackground }; color: ${  styles.buttonTextColor }; text-decoration: none; border-radius: ${  styles.buttonBorderRadius }; font-size: ${  styles.buttonFontSize }; transition: ${  styles.buttonTransition };">
                            Pogledajte
                        </a>
                        </div>
                    </body>
                    </html>
                    `
        };

        const info = await transporter.sendMail(mailOptions);

        if (!info.messageId) {
            ErrorHelper.throwEmailError();
        }
    }
    // Send email to notify that item is low on stock
    static async sendItemLowInStock(itemId, variationId) {
        try {
            const mailOptions = {
                from: "Tophelanke",
                to: process.env.EMAIL_ADMIN,
                subject: "Zaliha Artikla se smanjila!",
                text: `Količina Artikla ${itemId}, variacije: ${variationId} se smanjila!`,
                html: `
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Zaliha Artikla se smanjila!</title>
                    </head>
                    <body style="font-family: ${  styles.bodyFontFamily }; background-color: ${  styles.bodyBackground }; text-align: center; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: ${  styles.containerBackground }; padding: ${  styles.containerPadding }; border-radius: ${  styles.containerBorderRadius }; box-shadow: ${  styles.containerBoxShadow };">
                        <h1 style="color: ${  styles.alertHeadingColor }; margin-bottom: ${  styles.headingMarginBottom };">
                            Količina artikla ${  itemId }, varijacije: ${  variationId } se smanjila!
                        </h1>
                        <a href="${ process.env.BASE_URL}/admin/artikal-detalji/${  itemId }" 
                            style="display: inline-block; padding: ${  styles.buttonPadding }; background-color: ${  styles.buttonBackground }; color: ${  styles.buttonTextColor }; text-decoration: none; border-radius: ${  styles.buttonBorderRadius }; font-size: ${  styles.buttonFontSize }; transition: ${  styles.buttonTransition };">
                            Pogledajte
                        </a>
                        </div>
                    </body>
                    </html>
                `,
            };
    
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    throw new Error("Nije moguće poslati email!");
                }
            });
        } catch (error) {
            console.log("Nije moguće poslati email!");
        }
    }

    // Send email to notify that item is out of stock
    static async sendItemOutOfStock(itemId, variationId) {
        try {
            const mailOptions = {
                from: "Tophelanke",
                to: process.env.EMAIL_ADMIN,
                subject: "Zaliha Artikla se smanjila!",
                text: `Zaliha Artikla ${itemId}, variacije: ${variationId} je prazna!`,
                html: `
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Zaliha Artikla se izpraznila!</title>
                    </head>
                    <body style="font-family: ${  styles.bodyFontFamily }; background-color: ${  styles.bodyBackground }; text-align: center; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: ${  styles.containerBackground }; padding: ${  styles.containerPadding }; border-radius: ${  styles.containerBorderRadius }; box-shadow: ${  styles.containerBoxShadow };">
                        <h1 style="color: ${  styles.alertHeadingColor }; margin-bottom: ${  styles.headingMarginBottom };">
                            Količina artikla ${  itemId }, varijacije: ${  variationId } se izpraznila!
                        </h1>
                        <a href="${ process.env.BASE_URL}/admin/artikal-detalji/${  itemId }" 
                            style="display: inline-block; padding: ${  styles.buttonPadding }; background-color: ${  styles.buttonBackground }; color: ${  styles.buttonTextColor }; text-decoration: none; border-radius: ${  styles.buttonBorderRadius }; font-size: ${  styles.buttonFontSize }; transition: ${  styles.buttonTransition };">
                            Pogledajte
                        </a>
                        </div>
                    </body>
                    </html>
                `,
            };
    
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    throw new Error("Nije moguće poslati email!");
                }
            });
        } catch (error) {
            console.log("Nije moguće poslati email!");
        }
    }

    // Send email to notify that new order is created
    static async sendNewOrderNotification(orderId) {
        try {
            
        } catch (error) {
            console.log("Nije moguće poslati email!");
        }
    }
}

export default EmailService;