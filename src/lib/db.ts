import mysql from 'mysql2/promise'

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'bismillah123',
  database: process.env.DB_NAME || 'event_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing MySQL connection...')
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('✅ MySQL connection successful')
    return true
  } catch (error) {
    console.error('❌ MySQL connection failed:', error)
    return false
  }
}

// Export the pool as default
export default pool