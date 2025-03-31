# Beto Amparo
## Universidade
Universidade Federal do Tocantins
## Curso
Ciência da Computação
## Disciplina
Projeto de Sistemas
## Semestre
1º semestre de 2025
## Professor
Edeílson Milhomem
<h2>Integrantes do Projeto</h2>
  <table>
    <tr>
      <td>Gabriel Martiliano</td>
    </tr>
    <tr>
      <td>Ester Arraiz de Matos</td>
    </tr>
    <tr>
      <td>Neci Oneides da Silva</td>
    </tr>
    <tr>
      <td>Heloisa Rolins Ribeiro</td>
    </tr>
    <tr>
      <td>Dallyla de Moraes Sousa</td>
    </tr>
  </table>

# Canvas do Projeto Beto Amparo

| **Seção**                 | **Descrição** |
|---------------------------|--------------|
| **Proposta de Valor**     | Criar um sistema híbrido de atendimento humanizado que combina WhatsApp Business (para interação inicial) e uma plataforma web (para funcionalidades avançadas), permitindo atendimento, pedidos e agendamentos de forma prática e eficiente. |
| **Segmento de Clientes**  | Pequenos negócios e empreendedores que utilizam WhatsApp para vendas e atendimento. Clientes que desejam realizar pedidos e agendamentos sem necessidade de interação humana inicial. |
| **Canais**                | WhatsApp Business (mensagens automáticas com links para o site). Plataforma web responsiva (Next.js + Supabase). Progressive Web App (PWA) para acesso facilitado pelo celular. |
| **Relacionamento com Clientes** | Autoatendimento via WhatsApp e site. Dashboard para acompanhamento de pedidos. Notificações automáticas para manter o cliente informado. |
| **Atividades-Chave**      | Desenvolvimento da plataforma web (Next.js + Supabase). Integração com WhatsApp Business. Implementação do sistema de pedidos e agendamentos. Criação de um dashboard para gerenciamento dos pedidos. Implementação de PWA para donos de negócio. |
| **Recursos Principais**   | Plataforma web com sistema de pedidos e agendamentos. Banco de dados no Supabase para armazenar pedidos e clientes. WhatsApp Business API para envio de mensagens automáticas. Infraestrutura de hospedagem na Vercel. |
| **Parcerias Principais**  | Instituições como SEBRAE para captação de clientes. Donos de pequenos negócios que desejam digitalizar seus atendimentos. |
| **Estrutura de Custos**   | Hospedagem na Vercel (plano gratuito ou pago dependendo da demanda). Uso do Supabase (plano gratuito inicialmente, podendo escalar conforme necessário). Eventual aquisição de domínio personalizado. Investimento em marketing para atrair usuários. |
| **Fontes de Receita**     | Modelo de assinatura paga com três planos: **Básico** (plano mais acessível, funcionalidades essenciais). **Intermediário** (mais funcionalidades que o básico, como personalização básica e relatórios simples). **Avançado** (acesso completo, incluindo automação avançada e relatórios detalhados). Taxa sobre pedidos gerados pela plataforma. Publicidade ou parcerias estratégicas. |
  
# Escopo do Projeto Beto Amparo</h1>
### Objetivo: Criar um sistema híbrido de atendimento humanizado que combina WhatsApp Business (para interação inicial) + plataforma web (para funcionalidades avançadas), atendimento, pedidos e agendamentos.
# Beto Amparo - MVP e User Stories

## Funcionalidades Principais
**Site Externo** (Next.js + Supabase)  
**Formulário de pedidos e agendamentos**  
**Dashboard** para o dono do negócio visualizar demandas  
**Integração Indireta com WhatsApp**  
**Mensagens automáticas** (via WhatsApp Business App) com links para o site  
**PWA (Progressive Web App)**  
**Opção de instalação** no celular do dono do negócio  
## MVP (Mínimo Produto Viável)

| **Funcionalidade**      | **Descrição** |
|-------------------------|--------------|
| **Site de Pedidos**     | Página com formulário simples (produto, quantidade, contato). |
| **Dashboard Básico**    | Lista de pedidos recebidos (Supabase). |
| **Links no WhatsApp**   | Mensagem automática com link para o site (ex.: "Peça aqui: [link]"). |
| **PWA Opcional**        | Instalação do site como app (para donos de negócio). |
## Detalhamento das User Stories

### 1. Cliente
| **ID**  | **User Story** |
|---------|--------------|
| **US-01** | Como cliente, quero acessar um link no WhatsApp para fazer pedidos sem falar com um humano. |
| **US-02** | Como cliente, quero agendar horários via site sem precisar ligar. |

### 2. Dono do Negócio
| **ID**  | **User Story** |
|---------|--------------|
| **US-03** | Como dono, quero receber pedidos em um dashboard para organizar demandas. |
| **US-04** | Como dono, quero configurar mensagens automáticas no WhatsApp com links para o site. |

### 3. Admin
| **ID**  | **User Story** |
|---------|--------------|
| **US-05** | Como admin, quero que o site funcione offline (PWA) para donos sem internet estável. |
## Iteração 1: Site Básico + Supabase

| **Dev** | **Tarefa** | **Dependência** |
|--------|-----------|---------------|
| **Dallyla** | Criar páginas (Next.js): formulário de pedidos + dashboard | - |
| **Heloisa Rolins** | Configurar Supabase (tabelas pedidos, clientes) | - |
| **Gabriel Martiliano** | Integrar formulário com Supabase | D1, D2 |
| **Ester Arraiz** | Deploy na Vercel + configurar HTTPS | D1 |
| **Neci Silva** | Criar visualização de dados (gráficos simples) | - |
| **Todos** | Testes manuais e ajustes | Todos |

### **Entregável**  
✅ Site no ar com formulário e dashboard funcional.

## Home 
![Home sem login](fotos/Home%20Sem%20Login.png)
![Home logado](fotos/Home%20Logado.png)

## Login
![Login](https://github.com/user-attachments/assets/e170a99a-4259-4b74-8439-30b79ab8a8fc)

## Logout
![Logout](fotos/Logout.png)

## Recuperação de senha
![Recuperação de Senha](fotos/recuperacao_de_senha.png)

## Cadastro de empresa
![Cadastro empresa](https://github.com/user-attachments/assets/891fe8e3-5f94-4726-8479-863a71991837)

## Planos
![Planos](fotos/Planos.png)

## Dashboard do dono
![Texto alternativo](fotos/Dashboard%20do%20dono.svg)

## Área do dono
![Texto alternativo](fotos/Área%20do%20dono.svg)
![Texto alternativo](fotos/Área%20do%20dono%20(1).svg)

## Adicionar produto
![Texto alternativo](fotos/Adicionar%20produto.svg)

## Agendamentos
![Texto alternativo](fotos/Agendamentos%20(4).svg)
![Texto alterantivo](fotos/Agendamentos%20(1).svg)
![Texto alternativo](fotos/Agendamentos.png)

## Configurações de Respostas

![Respostas Automáticas](fotos/Respostas%20automáticas.png)

## Formulário de pedido
![Formulário de pedido](https://github.com/user-attachments/assets/57a78691-255d-4083-af70-0d805a1b9975)

## Pedidos recentes
![Texto alternativo](fotos/Pedidos%20recentes.png)

## Carrinho
![card](fotos/card.png)
![resumo](fotos/resumo.png)
![ordem](fotos/ordem.png)
![erro](fotos/ordem%20Erro.png)

## Produto individual
![individual](fotos/7%20-%20A%20-%20Advertising%20Banner.png)

## Cliente
![cliente](fotos/Cliente.png)
