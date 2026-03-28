import sgMail from '@sendgrid/mail';

export default async function sendEmail(sendMailTo, emailSubject, emailHTML) {
    try {
        sgMail.setApiKey(process.env.SENDGRID_MAIL_APIKEY);

        const emailMsg = {
            to: sendMailTo,
            from: process.env.SENDGRID_MAIL_USER,
            subject: emailSubject,
            html: emailHTML
        };

        const response = await sgMail.send(emailMsg);
        const statusCode = response[0].statusCode
        console.log("statusCode", statusCode);
        if (statusCode === 200) {
            console.log("email sent successfully")
        }
        // console.log(response[0].headers);
    } catch (error) {
        console.log("error", error.response.body);
    }
}