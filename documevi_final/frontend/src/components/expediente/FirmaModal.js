import React, { useRef } from 'react';
import Modal from 'react-modal';
import SignaturePad from 'react-signature-pad-wrapper';
import { toast } from 'react-toastify';

Modal.setAppElement('#root');

const FirmaModal = ({ isOpen, onRequestClose, onSubmit }) => {
    const sigPad = useRef(null);

    const clear = () => sigPad.current?.clear();

    const handleSubmit = () => {
        if (sigPad.current?.isEmpty()) {
            return toast.warn('Por favor, dibuje su firma.');
        }
        const firma_imagen = sigPad.current.toDataURL('image/png');
        onSubmit(firma_imagen);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onRequestClose={onRequestClose} 
            contentLabel="Firmar Documento"
            style={{ content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)', width: '550px' } }}
        >
            <h2>Firmar Documento</h2>
            <p>Por favor, dibuje su firma en el recuadro.</p>
            <div style={{ border: '1px solid black', borderRadius: '5px' }}>
                <SignaturePad ref={sigPad} options={{ penColor: 'black' }} canvasProps={{width: 500, height: 200, className: 'sigCanvas'}} />
            </div>
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <button onClick={handleSubmit} className="button button-primary">Guardar Firma</button>
                    <button onClick={clear} style={{ marginLeft: '10px' }} className="button">Limpiar</button>
                </div>
                <button onClick={onRequestClose} className="button">Cancelar</button>
            </div>
        </Modal>
    );
};

export default FirmaModal;