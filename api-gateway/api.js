const express = require('express');
const app = express();

// USE PROXY SERVER TO REDIRECT THE INCOMING REQUEST
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();

const jwt = require('jsonwebtoken');
const JWT_SECRET = "347186591486#^%%ABCF*##GHE";

function authToken(req, res, next) {
    console.log(req.headers.authorization);
    const header = req?.headers.authorization;
    const token = header && header.split(' ')[1];

    if (token == null) return res.status(401).json("Please send token");

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json("Invalid token");
        req.user = user;
        next();
    });
}

function authRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json("Unauthorized");
        }
        next();
    };
}

/*
localhost:4000/reg/registration

{
  "username":"lain",
  "email":"lain@gmail.com",
  "password":"aupp",
  "mobile": 12345678,
  "role": "user"
}
*/

//REDIRECT TO THE REGISTRATION MICROSERVICE

app.use('/reg', (req, res) => {
    console.log("INSIDE API GATEWAY REGISTRATION ROUTE")
    proxy.web(req, res, { target: 'http://localhost:5001' });
})

/*
localhost:4000/auth/login

{
  "email":"a@gmail.com",
  "password":"AUPP",
  "role":"user"
}

*/

// REDIRECT TO THE LOGIN (Authentication) MICROSERVICE
app.use('/auth', (req, res) => {
    console.log("INSIDE API GATEWAY LOGIN ROUTE");
    proxy.web(req, res, { target: 'http://3.86.212.187:5000' }); // user service handles auth/login
});

/*
localhost:4000/admin/viewallorders
localhost:4000/admin/addproduct
*/

// REDIRECT TO THE ADMIN MICROSERVICE
app.use('/admin', authToken, authRole('admin'), (req, res) => {
    console.log("INSIDE API GATEWAY ADMIN ROUTE");
    proxy.web(req, res, { target: 'http://3.91.181.254:5001' });
});

/*
localhost:4000/user/registration
localhost:4000/user/login
localhost:4000/user/order
*/

// REDIRECT TO THE USER MICROSERVICE
app.use('/user', authToken, authRole('user'), (req, res) => {
    console.log("INSIDE API GATEWAY USER ROUTE");
    proxy.web(req, res, { target: 'http://44.204.153.178:5002' });
});

app.listen(4000, () => {
    console.log("API Gateway Service is running on PORT NO : 4000");
});
