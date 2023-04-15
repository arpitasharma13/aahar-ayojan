const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const Donation = require("../models/donation.js");
const nodemailer = require("nodemailer");

router.get("/agent/dashboard", middleware.ensureAgentLoggedIn, async (req,res) => {
	const agentId = req.user._id;
	const numAssignedDonations = await Donation.countDocuments({ agent: agentId, status: "assigned" });
	const numCollectedDonations = await Donation.countDocuments({ agent: agentId, status: "collected" });
	res.render("agent/dashboard", {
		title: "Dashboard",
		numAssignedDonations, numCollectedDonations
	});
});

router.get("/agent/collections/pending", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const pendingCollections = await Donation.find({ agent: req.user._id, status: "assigned" }).populate("donor");
		res.render("agent/pendingCollections", { title: "Pending Collections", pendingCollections });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/agent/collections/previous", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const previousCollections = await Donation.find({ agent: req.user._id, status: "collected" }).populate("donor");
		res.render("agent/previousCollections", { title: "Previous Collections", previousCollections });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/agent/collection/view/:collectionId", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const collectionId = req.params.collectionId;
		const collection = await Donation.findById(collectionId).populate("donor");
		res.render("agent/collection", { title: "Collection details", collection });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/agent/collection/collect/:collectionId", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		//const donationId = req.params.donationId;
		const collectionId = req.params.collectionId;
		//await Donation.findByIdAndUpdate(donationId, { status: "accepted" })
		await Donation.findByIdAndUpdate(collectionId, { status: "collected", collectionTime: Date.now() })


		.populate("donor")
		.populate("agent");
		const admins = await User.find({ role: "admin" });
		const adminEmails = admins.map((admin) => admin.email);
		const adminName = admins.firstName + " " + admins.lastName;

		//const donation = await Donation.findById(donationId);
	    //const donorId = donation.donor

	  
	    //const donorUser = await User.findById(donorId);
	  
	  //const donorEmail = donorUser.email;
	  //const donorName = donorUser.firstName + " " + donorUser.lastName;

	  const transporter = await nodemailer.createTransport({
		service:"gmail", 
		auth: {
		  user: 'aaharayojan@gmail.com',
		  pass: 'lwxdqyxmdwpvvufp',
		},
	})

const message = {
	from: 'aaharayojan@gmail.com',
	to: adminEmails,
	subject: 'Donation collected',
	text: "Hello, "  +
	"\n This is a confirmation mail towards a succesfull collection of the assigned donation request."
};


transporter.sendMail(message, function(error, info){
	if (error) {
		console.log(error);
	} else {
		console.log('Email sent: ' + info.response);
	}
});
/*const message2 = {
	from: 'aaharayojan@gmail.com',
	to: donorEmail,
	subject: 'collected',
	text: "Hello "  + donorName +
	",\n A new donation has been submitted with the following details. Please log in to the dashboard to review it. \n Food Type :"
};
transporter.sendMail(message2, function(error, info){
	if (error) {
		console.log(error);
	} else {
		console.log('Email sent: ' + info.response);
	}
});*/

		req.flash("success", "Donation collected successfully");
		res.redirect(`/agent/collection/view/${collectionId}`);
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});



router.get("/agent/profile", middleware.ensureAgentLoggedIn, (req,res) => {
	res.render("agent/profile", { title: "My Profile" });
});

router.put("/agent/profile", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const id = req.user._id;
		const updateObj = req.body.agent;	// updateObj: {firstName, lastName, gender, address, phone}
		await User.findByIdAndUpdate(id, updateObj);
		
		req.flash("success", "Profile updated successfully");
		res.redirect("/agent/profile");
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
	
});


module.exports = router;