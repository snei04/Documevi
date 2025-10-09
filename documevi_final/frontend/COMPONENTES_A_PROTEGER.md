# Componentes Frontend a Proteger con Permisos Granulares

## ✅ Componentes Ya Protegidos

### GestionDependencias.js
- ✅ Botón "Crear Nueva Dependencia" → `dependencias_crear`
- ✅ Botón "Editar" → `dependencias_editar`
- ✅ Botón "Activar/Desactivar" → `dependencias_inactivar`

---

## 📋 Componentes Pendientes

### GestionOficinas.js
**Permisos a aplicar:**
- Botón "Crear Nueva Oficina" → `oficinas_crear`
- Botón "Editar" → `oficinas_editar`
- Botón "Activar/Desactivar" → `oficinas_inactivar`

**Cambios necesarios:**
```javascript
// Importar en la parte superior
import PermissionGuard from './auth/PermissionGuard';

// Proteger botón crear
<PermissionGuard permission="oficinas_crear">
    <button onClick={openCreateModal}>Crear Nueva Oficina</button>
</PermissionGuard>

// Proteger botón editar
<PermissionGuard permission="oficinas_editar">
    <button onClick={() => openEditModal(oficina)}>Editar</button>
</PermissionGuard>

// Proteger botón activar/desactivar
<PermissionGuard permission="oficinas_inactivar">
    <button onClick={() => handleToggleStatus(oficina.id, oficina.activo)}>
        {oficina.activo ? 'Desactivar' : 'Activar'}
    </button>
</PermissionGuard>
```

---

### GestionSeries.js
**Permisos a aplicar:**
- Botón "Crear Nueva Serie" → `series_crear`
- Botón "Editar" → `series_editar`
- Botón "Activar/Desactivar" → `series_inactivar`

---

### GestionSubseries.js
**Permisos a aplicar:**
- Botón "Crear Nueva Subserie" → `subseries_crear`
- Botón "Editar" → `subseries_editar`
- Botón "Activar/Desactivar" → `subseries_inactivar`

---

### GestionExpedientes.js
**Permisos a aplicar:**
- Botón "Crear Nuevo Expediente" → `expedientes_crear`
- Botón "Ver Detalle" → `expedientes_ver`
- Botón "Cerrar Expediente" → `expedientes_cerrar`

---

### GestionUsuarios.js
**Permisos a aplicar:**
- Botón "Invitar Usuario" → `usuarios_invitar`
- Botón "Editar" → `usuarios_editar`
- Botón "Activar/Desactivar" → `usuarios_inactivar`

---

### GestionRoles.js
**Permisos a aplicar:**
- Botón "Crear Nuevo Rol" → `roles_crear`
- Botón "Editar" → `roles_editar`
- Botón "Eliminar" → `roles_eliminar`
- Botón "Gestionar Permisos" → `permisos_asignar`

---

### GestionWorkflows.js
**Permisos a aplicar:**
- Botón "Crear Workflow" → `workflows_crear`
- Botón "Editar" → `workflows_editar`
- Botón "Ver Detalle" → `workflows_ver`

---

### GestionPlantillas.js
**Permisos a aplicar:**
- Botón "Crear Plantilla" → `plantillas_crear`
- Botón "Editar" → `plantillas_editar`
- Botón "Diseñar" → `plantillas_disenar`
- Botón "Eliminar" → `plantillas_eliminar`

---

### GestionPrestamos.js
**Permisos a aplicar:**
- Botón "Aprobar" → `prestamos_aprobar`
- Botón "Rechazar" → `prestamos_aprobar`
- Botón "Registrar Devolución" → `prestamos_devolver`
- Botón "Aprobar Prórroga" → `prestamos_prorrogar`

---

### GestionCamposPersonalizados.js
**Permisos a aplicar:**
- Botón "Crear Campo" → `campos_crear`
- Botón "Editar" → `campos_editar`
- Botón "Eliminar" → `campos_eliminar`

---

### GestionTransferencias.js
**Permisos a aplicar:**
- Botón "Crear Transferencia" → `transferencias_crear`
- Botón "Aprobar" → `transferencias_aprobar`
- Botón "Ejecutar" → `transferencias_ejecutar`

---

### GestionEliminacion.js
**Permisos a aplicar:**
- Botón "Crear Solicitud" → `eliminacion_crear`
- Botón "Aprobar" → `eliminacion_aprobar`
- Botón "Ejecutar Eliminación" → `eliminacion_ejecutar`

---

## 🎯 Patrón de Implementación

Para cada componente, seguir estos pasos:

1. **Importar dependencias:**
```javascript
import PermissionGuard from './auth/PermissionGuard';
```

2. **Envolver botones de acción:**
```javascript
<PermissionGuard permission="modulo_accion">
    <button onClick={handleAction}>Acción</button>
</PermissionGuard>
```

3. **Verificar que el componente ya tenga acceso al contexto de permisos** (la mayoría ya lo tienen a través de `ProtectedRoute`)

---

## 📝 Notas

- El `Sidebar.js` ya está protegido con permisos granulares
- Las rutas en `App.js` ya están protegidas con `ProtectedRoute`
- Solo falta proteger los **botones de acción** dentro de cada componente
