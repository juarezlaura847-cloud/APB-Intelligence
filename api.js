require("dotenv").config();

const express = require("express");
const cors = require("cors");
const supabase = require("./config/supabase");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/equipos", async (req,res)=>{

    const {data,error}=await supabase
        .from("equipos")
        .select("*")
        .order("id",{ascending:false});


    if(error){
        console.log(error);
        return res.status(500).json(error);
    }


    res.json(data);

});


app.listen(3000,()=>{
    console.log("API funcionando en puerto 3000");
});