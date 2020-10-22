var express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    methodOverride = require("method-override"),
    passport = require("passport"),
    localStrategy = require("passport-local"),
    Camp = require("./models/campground"),
    Comment = require("./models/comments");
    User = require("./models/user"),
    seedDb = require("./seed"),
    bodyParser = require("body-parser");

mongoose.connect("mongodb://localhost:27017/CampGrounds",{useNewUrlParser:true,useUnifiedTopology:true});
mongoose.set('useCreateIndex', true);
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
seedDb();

app.use(require("express-session")({
    secret:"This is a secret so shut up",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res,next){
    res.locals.curUser = req.user;
    next();
});
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",function(req,res){
    res.redirect("/campgrounds");
});


app.get("/campgrounds",function(req,res){
    Camp.find({},function(err,camps){
        if(err){
            console.log(err);
        }else{
            res.render("./camps/index",{camps:camps,curUser:req.user});
        }
    });
});

app.get("/campgrounds/new",function(req,res){
    res.render("./camps/new");
});

app.post("/campgrounds",function(req,res){
    Camp.create(req.body.camp,function(err,newGround){
        if(err){
            console.log(err)
        }else{
            res.redirect("/campgrounds");
        }
    });
});

app.get("/campgrounds/:id",IsLoggedIn,function(req,res){
    Camp.findById(req.params.id).populate("comments").exec(function(err,showCamp){
        if(err){
            console.log(err);         
        }else{
            res.render("./camps/show",{camp:showCamp});
        }
    });
});

app.get("/campgrounds/:id/comments/new",IsLoggedIn,function(req,res){
    res.render("./comments/new",{camp_id:req.params.id});
});

app.post("/campgrounds/:id/comments",function(req,res){
    Camp.findById(req.params.id,function(err,foundCamp){
        if(err){
            console.log(err);
        }else{
            var commentObj = req.body.comment;
            commentObj.author = req.user.username;
            Comment.create(commentObj,function(err,comment){
                if(err){
                    console.log(err);
                }else{
                    //console.log(comment);
                    foundCamp.comments.push(comment);
                    foundCamp.save();
                    res.redirect("/campgrounds/"+foundCamp._id);
                }
            });   
        }      
    });  
});    

// AUTH VIEWS//

app.get("/register",function(req,res){
    res.render("./user_auth/register");
});

app.post("/register",function(req,res){
    User.register(new User({username:req.body.username,email:req.body.email}),req.body.password,function(err,user){
        if(err){
            console.log(err);
            return res.render("./user_auth/register");
        }else{
            passport.authenticate("local")(req,res,function(){
            res.redirect("/campgrounds");
            });
        }
    });
});

app.get("/login",function(req,res){
    res.render("./user_auth/login");
});

app.post("/login",passport.authenticate("local",{
    successRedirect:"/campgrounds",
    failureRedirect:"/login",
    failureMessage:"unable to login"
}),function(req,res){
    
});

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/login");
});

function IsLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }else{
        res.redirect("/login");
    }
}

var port = process.env.PORT || 3000;
app.listen(port,function(){
    console.log("server is running....");
});