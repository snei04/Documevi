export const initialState = {
    expediente: null,
    isLoading: true,
    error: '',
    documentosDisponibles: [],
    workflows: [],
    plantillas: [],
    customFields: [],
    customData: {},
    plantillaSeleccionada: null,
    datosPlantilla: {},
    // Estados de la UI centralizados
    ui: {
        showPrestamoForm: false,
        isViewerModalOpen: false,
        viewingFileUrl: '',
        isSignatureModalOpen: false,
        isDateModalOpen: false,
        targetDocumentoIdWorkflow: null,
        targetDocumentoIdFirma: null,
    }
};

export function expedienteReducer(state, action) {
    switch (action.type) {
        // Casos para la Carga de Datos
        case 'FETCH_START':
            return { ...state, isLoading: true, error: '' };
        case 'FETCH_SUCCESS':
            return {
                ...state,
                isLoading: false,
                ...action.payload,
            };
        case 'FETCH_ERROR':
            return { ...state, isLoading: false, error: action.payload };
        
        // Casos para la UI
        case 'TOGGLE_PRESTAMO_FORM':
            return { ...state, ui: { ...state.ui, showPrestamoForm: !state.ui.showPrestamoForm } };
        case 'TOGGLE_DATE_MODAL':
            return { ...state, ui: { ...state.ui, isDateModalOpen: !state.ui.isDateModalOpen } };
        case 'OPEN_VIEWER_MODAL':
            return { ...state, ui: { ...state.ui, isViewerModalOpen: true, viewingFileUrl: action.payload } };
        case 'OPEN_SIGNATURE_MODAL':
            return { ...state, ui: { ...state.ui, isSignatureModalOpen: true, targetDocumentoIdFirma: action.payload } };
        case 'SET_TARGET_WORKFLOW':
            return { ...state, ui: { ...state.ui, targetDocumentoIdWorkflow: action.payload } };
        case 'CLOSE_MODALS':
            return { ...state, ui: { ...state.ui, isViewerModalOpen: false, isSignatureModalOpen: false, viewingFileUrl: '', targetDocumentoIdFirma: null } };
        
        // Casos para Formularios
        case 'SET_CUSTOM_DATA':
            return { ...state, customData: action.payload };
        case 'SELECT_PLANTILLA':
            return { ...state, plantillaSeleccionada: action.payload, datosPlantilla: {} };
        case 'SET_PLANTILLA_DATA':
            return { ...state, datosPlantilla: action.payload };
            
        default:
            return state;
    }
}