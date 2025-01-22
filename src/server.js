import express from 'express'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'

const prisma = new PrismaClient()
const app = express()
app.use(express.json())

app.use(cors({
    origin: 'https://cadastro-usuarios-kappa.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization'], 
}))

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://cadastro-usuarios-kappa.vercel.app')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.status(200).end()
})

const port = process.env.PORT ?? 3000

const validateUserInput = (data) => {
    const errors = []

    if (!data.email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) {
        errors.push("O Email é inválido!")
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push("O Nome é obrigatório!")
    }

    if (data.age !== undefined && (!Number.isInteger(data.age) || data.age <= 0)) {
        errors.push("A Idade deve ser um número inteiro maior que 0!")
    }

    return errors
}

app.post('/usuarios', async (req, res) => {
    try {
        const errors = validateUserInput(req.body)

        if (errors.length > 0) {
            return res.status(400).json({ errors })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: req.body.email }
        })

        if (existingUser) {
            return res.status(400).json({ error: "O Email já está em uso!" })
        }

        const newUser = await prisma.user.create({
            data: {
                email: req.body.email,
                name: req.body.name,
                age: req.body.age
            }
        })

        res.status(201).json(newUser)
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar usuário!" })
    }
})

app.get('/usuarios', async (req, res) => {
    try {
        let users = []

        if (req.query) {
            const age = req.query.age ? parseInt(req.query.age) : undefined

            users = await prisma.user.findMany({
                where: {
                    email: req.query.email,
                    name: req.query.name,
                    age: age
                }
            })
        } else {
            users = await prisma.user.findMany()
        }

        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar usuários!" })
    }
})

app.put('/usuarios/:id', async (req, res) => {
    try {
        const errors = validateUserInput(req.body)

        if (errors.length > 0) {
            return res.status(400).json({ errors })
        }

        const updateUser = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                email: req.body.email,
                name: req.body.name,
                age: req.body.age
            }
        })

        res.status(200).json(updateUser)
    } catch (error) {
        res.status(400).json({ error: "Erro ao atualizar usuário!" })
    }
})

app.delete('/usuarios/:id', async (req, res) => {
    try {
        await prisma.user.delete({
            where: {
                id: req.params.id
            }
        })

        res.status(200).json({ message: "Usuário deletado com sucesso!" })
    } catch (error) {
        res.status(404).json({ error: "Usuário não encontrado!" })
    }
})

app.listen(port, () => console.log('Server is running on port', port))
