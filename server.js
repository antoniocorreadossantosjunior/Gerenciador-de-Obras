const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("frontend")); // pasta do HTML, CSS e JS

let obras = [];
let proximoIdObra = 1;

// ROTAS
app.get("/obras", (req, res) => res.json(obras));
app.post("/obras", (req, res) => {
  const { nome, localizacao, responsavel, status, progresso } = req.body;
  if (!nome || !localizacao || !status || typeof progresso !== "number") {
    return res.status(400).json({ mensagem: "Dados inválidos." });
  }
  const novaObra = { id: proximoIdObra++, nome, localizacao, responsavel, status, progresso, etapas: [] };
  obras.push(novaObra);
  res.status(201).json(novaObra);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
