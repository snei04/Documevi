const nodemailer = require('nodemailer');

// 1. Configurar el "transporter" con el servicio y las credenciales
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Necesario para envíos locales
  }
});

// 2. Crear una función reutilizable para enviar correos
const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: `"Documevi Notificaciones" <${process.env.EMAIL_USER}>`,
    to: to,       // A quién se le envía
    subject: subject, // Asunto del correo
    text: text,     // Cuerpo del correo en texto plano
    html: html      // Cuerpo del correo en HTML (opcional)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Correo enviado a: ${to}`);
  } catch (error) {
    console.error(`Error al enviar correo a ${to}:`, error);
  }
};

module.exports = { sendEmail };