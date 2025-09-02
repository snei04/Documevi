import React from 'react';
import Modal from 'react-modal';
import './Terms.css'; // Crearemos este archivo para los estilos

const TermsModal = ({ isOpen, onRequestClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Términos y Condiciones"
      className="terms-modal"
      overlayClassName="terms-overlay"
    >
      <div className="terms-header">
        <h2>TÉRMINOS Y CONDICIONES DE USO – PLATAFORMA DOCUMEVI SGDEA</h2>
        <button onClick={onRequestClose}>X</button>
      </div>
      <div className="terms-content">
        <p><strong>Última actualización:</strong> 26 de agosto de 2025</p>
        <p>Bienvenido a la plataforma de Sistema de Gestión de Documentos Electrónicos de Archivo ("SGDEA" o la "Plataforma"), propiedad de IMEVI SAS. Los siguientes términos y condiciones (los "Términos") rigen el uso que usted ("el Usuario") hace de esta Plataforma. Al acceder y utilizar la Plataforma, usted acepta estar sujeto a estos Términos y a nuestra Política de Tratamiento de Datos Personales.</p>
        
        <h3>1. OBJETO DEL SERVICIO</h3>
        <p>El objetivo de la Plataforma es permitir a los usuarios de IMEVI SAS crear, almacenar, organizar, recuperar y distribuir documentos digitales de manera eficiente y segura, aplicando la normativa y lineamientos definidos. Las funcionalidades principales incluyen:<br/>
•	Captura de Documentos: Carga de documentos en diversos formatos, incluyendo la extracción de metadatos mediante OCR. <br/>
•	Gestión de Expedientes: Agrupación de documentos relacionados en expedientes electrónicos, con control sobre su ciclo de vida (apertura, cierre, transferencia). <br/>
•	Parametrización de TRD: Administración de las Tablas de Retención Documental para definir el ciclo de vida, retención y disposición final de los documentos. <br/>
•	Flujos de Trabajo (Workflow): Automatización de procesos de revisión y aprobación de documentos. <br/>
•	Firma Electrónica: Facilidad para firmar documentos digitalmente, garantizando su integridad. <br/>
•	Préstamo y Consulta: Módulo para solicitar, aprobar y gestionar el préstamo de expedientes. <br/>
•	Auditoría y Reportes: Trazabilidad de las acciones de los usuarios y generación de informes como el Formato Único de Inventario Documental (FUID). <br/>
</p>
        
        <h3>2. CUENTAS DE USUARIO Y SEGURIDAD</h3>
        <p>El acceso a la Plataforma requiere la creación de una cuenta de usuario. El Usuario es el único responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran en su cuenta. El Usuario se compromete a notificar a IMEVI SAS de cualquier uso no autorizado de su cuenta. La Plataforma permite marcar a un usuario como inactivo sin eliminarlo del sistema para mantener la integridad de los registros de auditoría. </p>

        <h3>3. POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES Y HABEAS DATA</h3>
        <p>En cumplimiento con la legislación colombiana, específicamente la 
Ley Estatutaria 1581 de 2012 y la 
Ley Estatutaria 1266 de 2008 (Ley de Habeas Data), IMEVI SAS se compromete a proteger la información personal de los Usuarios.<br/><br/>
•	Finalidad del Tratamiento: Los datos personales recolectados (nombre, documento de identidad, correo electrónico) se utilizarán para:<br/> 
o	Autenticar al Usuario en la Plataforma.<br/>
o	Registrar las acciones del Usuario en el módulo de auditoría para garantizar la trazabilidad y seguridad del sistema. <br/>
o	Identificar al Usuario como responsable o participante en los módulos de préstamos y flujos de trabajo.<br/>
o	Enviar notificaciones por correo electrónico relacionadas con las funcionalidades del sistema. <br/><br/>
•	Derechos del Titular (Habeas Data): Como titular de sus datos personales, el Usuario tiene derecho a:<br/>
o	Conocer, actualizar y rectificar su información personal frente a IMEVI SAS.<br/>
o	Solicitar prueba de la autorización otorgada para el tratamiento de sus datos.<br/>
o	Ser informado sobre el uso que se le ha dado a sus datos personales.<br/>
o	Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.<br/>
o	Revocar la autorización y/o solicitar la supresión del dato cuando en el tratamiento no se respeten los principios, derechos y garantías constitucionales y legales.<br/><br/>
•	Procedimiento: Para ejercer estos derechos, el Usuario deberá comunicarse con el administrador del sistema designado por IMEVI SAS a través de los canales oficiales.<br/><br/>
•	Seguridad: IMEVI SAS implementa las medidas técnicas, humanas y administrativas necesarias para garantizar la seguridad de los datos personales, evitando su adulteración, pérdida, consulta o acceso no autorizado. <br/>
</p>
        <h3>4. USO DEL CONTENIDO Y FIRMA ELECTRÓNICA </h3>
        <p>El Usuario es el único responsable del contenido de los documentos que carga, genera y gestiona en la Plataforma. El uso de la funcionalidad de firma electrónica en la Plataforma se rige por la 
Ley 527 de 1999, y se entenderá que el Usuario manifiesta su consentimiento y la validez del acto al utilizar dicha herramienta.
</p>
        <h3>5. PROPIEDAD INTELECTUAL</h3>
        <p>El software, código, diseño y marcas de la Plataforma DOCUMEVI SGDEA son propiedad de IMEVI SAS. Se prohíbe su copia, distribución o modificación sin autorización expresa. Los documentos y la información cargada por los Usuarios son propiedad y responsabilidad de los mismos o de la entidad a la que pertenecen.</p>
        <h3>6. LIMITACIÓN DE RESPONSABILIDAD  </h3>
        <p>IMEVI SAS no se hace responsable por la pérdida de información debida a un mal uso de la Plataforma por parte del Usuario, fallos en los equipos del Usuario o eventos de fuerza mayor. Es responsabilidad del Usuario realizar copias de seguridad de su información crítica.</p>
        <h3>7. MODIFICACIONES A LOS TÉRMINOS  </h3>
        <p>IMEVI SAS se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones serán notificadas a los Usuarios y entrarán en vigor a partir de su publicación en la Plataforma.</p>
        <h3>8. LEY APLICABLE Y JURISDICCIÓN</h3>
        <p>Estos Términos se regirán e interpretarán de acuerdo con las leyes de la República de Colombia. Cualquier controversia derivada de su interpretación o aplicación se someterá a la jurisdicción de los tribunales de Bogotá D.C., Colombia.</p>
      </div>
    </Modal>
  );
};

export default TermsModal;