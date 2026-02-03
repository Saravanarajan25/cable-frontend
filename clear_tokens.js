/**
 * AUTOMATIC TOKEN CLEANUP SCRIPT
 * 
 * This script clears invalid tokens from localStorage on app startup
 * Run this once to fix all 401 errors
 */

console.log('🔧 Clearing localStorage tokens...');

// Clear all auth-related data
localStorage.removeItem('token');
localStorage.removeItem('user');

console.log('✅ Tokens cleared!');
console.log('📝 Please refresh the page and login again.');
console.log('');
console.log('Login credentials:');
console.log('  Username: admin');
console.log('  Password: admin123');
