import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const GestionCamposPersonalizados = () => {
    const [oficinas, setOficinas] = useState([]);
    const [selectedOficina, setSelectedOficina] = useState('');
    const [campos, setCampos] = useState([]);
    const [newCampo, setNewCampo] = useState({
        nombre_campo: '',
        tipo_campo: 'texto',
        es_obligatorio: false
    });

    // Cargar la lista de oficinas al iniciar
    useEffect(() => {
        const fetchOficinas = async () => {
            try {
                const res = await api.get('/oficinas');
                setOficinas(res.data);
            } catch (err) {
                toast.error('No se pudieron cargar las oficinas.');
            }
        };
        fetchOficinas();
    }, []);

    // Función para cargar los campos de la oficina seleccionada
    const fetchCampos = useCallback(async () => {
        if (!selectedOficina) {
            setCampos([]);
            return;
        }
        try {
            const res = await api.get(`/campos-personalizados/oficina/${selectedOficina}`);
            setCampos(res.data);
        } catch (err) {
            toast.error('Error al cargar los campos para esta oficina.');
        }
    }, [selectedOficina]);

    // Volver a cargar los campos cada vez que se cambia de oficina
    useEffect(() => {
        fetchCampos();
    }, [fetchCampos]);


    const handleNewCampoChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewCampo(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCreateCampo = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/campos-personalizados/oficina/${selectedOficina}`, newCampo);
            toast.success('Campo personalizado creado con éxito.');
            setNewCampo({ nombre_campo: '', tipo_campo: 'texto', es_obligatorio: false });
            fetchCampos(); // Recargar la lista de campos
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear el campo.');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Gestionar Campos Personalizados por Oficina</h1>
            <div style={{ marginBottom: '20px' }}>
                <label>Seleccione una Oficina Productora:</label>
                <select value={selectedOficina} onChange={(e) => setSelectedOficina(e.target.value)}>
                    <option value="">-- Seleccione --</option>
                    {oficinas.map(ofi => (
                        <option key={ofi.id} value={ofi.id}>{ofi.nombre_oficina}</option>
                    ))}
                </select>
            </div>

            {selectedOficina && (
                <>
                    <form onSubmit={handleCreateCampo} style={{ marginBottom: '40px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
                        <h3>Añadir Nuevo Campo Personalizado</h3>
                        <input type="text" name="nombre_campo" placeholder="Nombre del Campo (ej. No. Contrato)" value={newCampo.nombre_campo} onChange={handleNewCampoChange} required />
                        <select name="tipo_campo" value={newCampo.tipo_campo} onChange={handleNewCampoChange} style={{ marginLeft: '10px' }}>
                            <option value="texto">Texto</option>
                            <option value="numero">Número</option>
                            <option value="fecha">Fecha</option>
                        </select>
                        <label style={{ marginLeft: '10px' }}>
                            <input type="checkbox" name="es_obligatorio" checked={newCampo.es_obligatorio} onChange={handleNewCampoChange} />
                            ¿Es obligatorio?
                        </label>
                        <button type="submit" style={{ marginLeft: '10px' }}>Añadir Campo</button>
                    </form>

                    <h3>Campos Definidos para esta Oficina</h3>
                    <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                       <thead>
                           <tr>
                               <th>Nombre del Campo</th>
                               <th>Tipo</th>
                               <th>Obligatorio</th>
                           </tr>
                       </thead>
                       <tbody>
                           {campos.map(campo => (
                               <tr key={campo.id}>
                                   <td>{campo.nombre_campo}</td>
                                   <td>{campo.tipo_campo}</td>
                                   <td>{campo.es_obligatorio ? 'Sí' : 'No'}</td>
                               </tr>
                           ))}
                       </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default GestionCamposPersonalizados;