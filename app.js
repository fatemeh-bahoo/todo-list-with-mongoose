const express = require("express");
const bodyParder = require("body-parser");
const mongoose = require ("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine" , "ejs");
app.use(bodyParder.urlencoded({extended:true}));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB' , { useNewUrlParser: true });
}

const itemsSchema = new mongoose.Schema ({
   name : String 
});

const Item = mongoose.model ("Item" , itemsSchema);

const item1 = new Item ({
    name: "Welcome to your todolist."
});

const item2 = new Item ({
    name: "Hit the + button to add a new item."
});

const item3 = new Item ({
    name: "Hit <-- to delete an item."
});

const defaultItems = [item1 , item2, item3];

const listSchema = {
    name: String,

    items : [itemsSchema]
};
const List = mongoose.model("List" , listSchema);

    app.get("/", function(req, res) {
        Item.find({}).then((foundItems , err) => {
            if (foundItems.length === 0){       
                Item.insertMany(defaultItems)
                  .then(() => {
                    console.log("Successfully inserted default items");
                })
                  .catch((err) => {
                      console.log(err);
                    });
                    res.redirect("/");
            } else{
                res.render("list", { listTitle: "Today", newListItems: foundItems });
            }
       });
    });

    app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

        List.findOne({ name: customListName }, "name items").then((foundList , err) => {
                if (!foundList) {
                    const list = new List({
                        name: customListName,
                        items: defaultItems
                    });
                    list.save();
                    res.redirect("/" + customListName);                  
                } else {
                    res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
                }
            }).catch(err => {
                console.log(err);
            });
        })

app.post("/" , function(req, res){
    
    const itemName = req.body.todoItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });
    if (listName === "Today"){
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name : listName} , "name items").then((foundList , err) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
})}
});

app.post("/delete" , function(req, res){
    const checkedItemId = req.body.checkbox1;
    const listName = req.body.listName1;
        if(listName === "Today"){
            Item.findByIdAndRemove(checkedItemId).then((err) => {
        if (err) {
            res.redirect("/");
        }
    });
} else{
        List.findOneAndUpdate({ name: listName },{ $pull: { items: { _id: checkedItemId } } },{ new: true }).then((foundList) => {
      if (foundList) {
            console.log("Item removed from list successfully.");
            res.redirect("/" + listName);
      } 
    })
    .catch((err) => {
      console.log("An error occurred:", err);
      res.redirect("/");
    });
}})


app.listen(3000 , function(){
    console.log("Server started on port 3000");
})