import sgMail from '@sendgrid/mail';

function buildEmailTemplate(subject, emailHTML) {
    return `
        <div style="margin:0;padding:24px;background:#f3f4f6;">
            <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
                <div style="padding:20px 24px;background:#111827;color:#ffffff;">
                    <div style="font-size:20px;font-weight:700;line-height:1.3;">Sneaker Cleaning Manager</div>
                    <div style="font-size:13px;line-height:1.5;opacity:0.85;margin-top:4px;">${subject}</div>
                </div>
                <div style="padding:24px;font-family:Arial,sans-serif;line-height:1.6;color:#222;">
                    ${emailHTML}
                </div>
            </div>
        </div>
    `;
}

export default async function sendEmail(sendMailTo, emailSubject, emailHTML) {
    try {
        console.log("..........................email template: ", buildEmailTemplate(emailSubject, emailHTML));
        sgMail.setApiKey(process.env.SENDGRID_MAIL_APIKEY);

        const emailMsg = {
            to: sendMailTo,
            from: process.env.SENDGRID_MAIL_USER,
            subject: emailSubject,
            html: buildEmailTemplate(emailSubject, emailHTML)
        };

        const response = await sgMail.send(emailMsg);
        const statusCode = response[0].statusCode
        console.log("statusCode", statusCode);
        if (statusCode >= 200 && statusCode < 300) {
            console.log("email sent successfully")
        }
        // console.log(response[0].headers);
    } catch (error) {
        console.log("error", error.response?.body || error.message);
    }
}