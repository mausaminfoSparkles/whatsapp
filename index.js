import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const serverToken = process.env.TOKEN;
const port = process.env.PORT;
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/webhook", (req, res) => {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode === "subscribe" && token === serverToken) {
            return res.status(200).send(challenge)
        } else {
            return res.status(400).json({
                status: false,
                message: "Something went wrong"
            })
        }
    } catch (error) {
        console.log(error);
    }
});

app.post('/webhook', async (req, res) => {
    try {
        const {
            body
        } = req;
        if (body?.object) {
            const entry = body.entry;
            const changes = body.entry[0].changes;
            const messages = body.entry[0].changes[0].value.messages;
            const message = body.entry[0].changes[0].value.messages[0];
            console.log("xoxoxo-data",{
                entry,
                changes,
                message,
                messages
            });
            if (entry && changes && messages && message) {
                const phoneNoId = changes[0].value.metadata.phone_number_id;
                const from = changes[0].value.messages[0].from;
                const msgBody = changes[0].value.messages[0].text.body;
                console.log("data - - - - - ",{
                    phoneNoId,
                    msgBody,
                    from,
                });
                
                const response = await axios({
                    method: "POST",
                    url: "https://graph.facebook.com/v13.0/" + phoneNoId + "/messages?access_token=" + serverToken,
                    data: {
                        messaging_product: "whatsapp",
                        to: from,
                        text: {
                            body: "This is from developeres side" + msgBody
                        }
                    },
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                console.log("response - - - ",response.data);
                return res.status(200).json({
                    status:true,
                    data:response?.data
                })
            }else{
                return res.status(400).json({
                    status:false
                })
            }
        } else {
            return res.status(400).json({
                status: false,
                message: "Something went wrong"
            });
        }
    } catch (error) {
        console.log(error);
    }
})

app.listen(port || 5050, () => {
    console.log("Server started at port ", port);
})