import React, { useState, useEffect } from 'react';
import AddExistingDocument from './acciones/AddExistingDocument';
import GenerateFromTemplate from './acciones/GenerateFromTemplate';
import CreateNewDocument from './acciones/CreateNewDocument';

const AccionesProductor = ({ state, expediente, onDataChange }) => {


    return (
        <>
            <AddExistingDocument
                expediente={expediente}
                onDataChange={onDataChange}
                documentosDisponibles={state.documentosDisponibles}
            />

            <GenerateFromTemplate
                expediente={expediente}
                onDataChange={onDataChange}
                plantillas={state.plantillas}
            />

            <CreateNewDocument
                expediente={expediente}
                onDataChange={onDataChange}
            />
        </>
    );
};

export default AccionesProductor;