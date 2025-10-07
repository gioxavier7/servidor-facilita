const jwt = require('jsonwebtoken')

function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] //bearer <token>

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado.' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = {
            id: decoded.id,
            tipo_conta: decoded.tipo_conta,
            email: decoded.email
        }
        next()
    } catch (error) {
        return res.status(403).json({ message: 'Token inválido ou expirado.' })
    }
}

module.exports = autenticarToken