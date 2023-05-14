const express = require("express");
let apiRoute = express.Router();
const { apiModel } = require("../model/api_model");

apiRoute.get("/getUserApi/:id",async (req, res) => {
  let id = req.params.id;
  try {
    let userApiData = await apiModel.find({
      userID: id,
    });
    res.send(userApiData);
  } catch (error) {
    res.status(400);
    res.send("something went wrong");
  }
});

apiRoute.post("/saveUserApi",async (req, res) => {
  let payload = req.body;
  try {
    let userApi = await apiModel(payload);
    userApi.save();
    res.send("api added");
  } catch (error) {
    res.status(400);
    res.send("something went wrong");
  }
});

apiRoute.delete("/delete/:id",async(req,res)=>{
  let id= req.params.id;
  try{
    await apiModel.findByIdAndDelete(id)
    res.send({message:"Api Removed"})
  }catch(err){
    res.send(err.message)
  }
  
})

module.exports = { apiRoute };
