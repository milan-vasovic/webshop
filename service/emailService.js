import nodemailer from 'nodemailer';

import PDFService from './pdfService.js';

import ErrorHelper from '../helper/errorHelper.js';

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

class EmailService {
    static async sendNewContactNotification(name, email,contactId) {
        const mailOptions = {
            from: "Kuvajmo Zajedno",
            to: "milan.vasovic.work@gmail.com",
            subject: "Dobliste novi upit!",
            text: "Imate novi upit iz kontakt forme",
            html: `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Dobliste novi upit!</title>
                </head>
                <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; text-align: center; padding: 20px;">
                    <div style="margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                        <h1 style="color: #ad1b1b; margin-bottom: 20px;">Dobliste novi upit!</h1>
                        <h2 style="color: #009688; margin-bottom: 10px;">Imate novi upit iz kontakt forme od ${name} na email: ${email}</h2>
                        <a href="http://localhost:3000/admin/kontakt-detalji/${contactId}" style="display: inline-block; padding: 12px 24px; background-color: #009688; color: #fff; text-decoration: none; border-radius: 4px; font-size: 16px; transition: background-color 0.3s;">Pogledajte</a>
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

    static async sendOrderInfo(name, email, orderInfo) {
        try {
            const itemsInfo = orderInfo.items.map(item => ({
                Naziv: item.title,
                Velicina: item.size,
                Boja: item.color,
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
            console.log("email nije poslat");
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
                        <title>Zatražiliste Restartovanje Šifre</title>
                    </head>
                    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; text-align: center; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                            <h1 style="color: #009688; margin-bottom: 20px;">Restartujte Šifru</h1>
                            <p style="color: #333; font-size: 16px; margin-bottom: 30px;">Pozdrav ${user.firstName},</p>
                            <p style="color: #333; font-size: 16px; margin-bottom: 30px;">Vi ste zatražili restartovanje šifre. Kliknite na link ispod:</p>
                            <a href="http://localhost:3000/napravite-novu-sifru/${user.resetToken}" style="display: inline-block; padding: 12px 24px; background-color: #009688; color: #fff; text-decoration: none; border-radius: 4px; font-size: 16px; transition: background-color 0.3s;">Restartovanje Šifre</a>
                            <p style="color: #333; font-size: 16px; margin-top: 30px;">Ako niste zatražili, ignorišite ovaj email.</p>
                        </div>
                    </body>
                </html>`
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
    
    //Send email to notify that  item is backorderd
    static async sendItemBackordered(itemId, variationId) {
        try {
            
        } catch (error) {
            console.log("Nije moguće poslati email!");
        }
    }
    
    // Send email to notify that item is low on stock
    static async sendItemLowInStock(itemId, variationId) {
        try {
            
        } catch (error) {
            console.log("Nije moguće poslati email!");
        }
    }

    // Send email to notify that item is out of stock
    static async sendItemOutOfStock(itemId, variationId) {
        try {
            
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