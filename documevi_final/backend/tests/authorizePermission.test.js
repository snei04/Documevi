const assert = require('assert');
const authorizePermission = require('../src/middleware/authorizePermission');

console.log('Running tests for authorizePermission middleware...');

// Mock objects
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

const mockNext = () => {
    let called = false;
    const next = () => {
        called = true;
    };
    next.wasCalled = () => called;
    return next;
};

// Test 1: Should call next() if user has the required permission
try {
    const req = {
        user: {
            permissions: ['ver_expedientes', 'editar_fechas_expediente']
        }
    };
    const res = mockRes();
    const next = mockNext();
    
    authorizePermission('editar_fechas_expediente')(req, res, next);
    
    assert.strictEqual(next.wasCalled(), true, 'next() should be called');
    console.log('✅ Test 1 Passed: Access granted with correct permission');
} catch (error) {
    console.error('❌ Test 1 Failed:', error.message);
}

// Test 2: Should return 403 if user does not have the required permission
try {
    const req = {
        user: {
            permissions: ['ver_expedientes']
        }
    };
    const res = mockRes();
    const next = mockNext();
    
    authorizePermission('editar_fechas_expediente')(req, res, next);
    
    assert.strictEqual(next.wasCalled(), false, 'next() should not be called');
    assert.strictEqual(res.statusCode, 403, 'Status code should be 403');
    assert.strictEqual(res.body.msg, 'No tienes permiso para realizar esta acción.', 'Error message mismatch');
    console.log('✅ Test 2 Passed: Access denied without permission');
} catch (error) {
    console.error('❌ Test 2 Failed:', error.message);
}

// Test 3: Should return 403 if req.user or permissions are missing
try {
    const req = {
        user: {} // No permissions array
    };
    const res = mockRes();
    const next = mockNext();
    
    authorizePermission('editar_fechas_expediente')(req, res, next);
    
    assert.strictEqual(next.wasCalled(), false, 'next() should not be called');
    assert.strictEqual(res.statusCode, 403, 'Status code should be 403');
    assert.strictEqual(res.body.msg, 'Acceso denegado. Permisos insuficientes.', 'Error message mismatch');
    console.log('✅ Test 3 Passed: Access denied with invalid user object');
} catch (error) {
    console.error('❌ Test 3 Failed:', error.message);
}

console.log('Tests completed.');
