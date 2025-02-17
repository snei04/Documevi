import mysql from 'mysql2'
import keys from '../key'

const connection = mysql.createConnection(keys)


export default connection;
