const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true, // true para puerto 465 (Gmail), false para otros
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: '"Documevi" <tucorreo@gmail.com>', // El remitente
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`Error al enviar correo a ${options.to}:`, error);
        throw new Error('No se pudo enviar el correo de recuperación.');
    }
};

module.exports = sendEmail;