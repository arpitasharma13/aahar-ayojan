const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const Donation = require("../models/donation.js");
const nodemailer = require('nodemailer');



router.get("/admin/dashboard", middleware.ensureAdminLoggedIn, async (req,res) => {
	const numAdmins = await User.countDocuments({ role: "admin" });
	const numDonors = await User.countDocuments({ role: "donor" });
	const numAgents = await User.countDocuments({ role: "agent" });
	const numPendingDonations = await Donation.countDocuments({ status: "pending" });
	const numAcceptedDonations = await Donation.countDocuments({ status: "accepted" });
	const numAssignedDonations = await Donation.countDocuments({ status: "assigned" });
	const numCollectedDonations = await Donation.countDocuments({ status: "collected" });
	res.render("admin/dashboard", {
		title: "Dashboard",
		numAdmins, numDonors, numAgents, numPendingDonations, numAcceptedDonations, numAssignedDonations, numCollectedDonations
	});
});

router.get("/admin/donations/pending", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const pendingDonations = await Donation.find({status: ["pending", "accepted", "assigned"]}).populate("donor");
		res.render("admin/pendingDonations", { title: "Pending Donations", pendingDonations });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donations/previous", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const previousDonations = await Donation.find({ status: "collected" }).populate("donor");
		res.render("admin/previousDonations", { title: "Previous Donations", previousDonations });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donation/view/:donationId", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const donationId = req.params.donationId;
		const donation = await Donation.findById(donationId).populate("donor").populate("agent");
		res.render("admin/donation", { title: "Donation details", donation });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donation/accept/:donationId", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const donationId = req.params.donationId;
		await Donation.findByIdAndUpdate(donationId, { status: "accepted" })

		.populate("donor")
		.populate("agent");
		const donation = await Donation.findById(donationId);
	  const donorId = donation.donor

	  
	  const donorUser = await User.findById(donorId);
	  
	  const donorEmail = donorUser.email;
	  const donorName = donorUser.firstName + " " + donorUser.lastName;

	  const transporter = await nodemailer.createTransport({
		service:"gmail", 
		auth: {
		  user: 'aaharayojan@gmail.com',
		  pass: 'lwxdqyxmdwpvvufp',
		},
	})
		
	const message = {
		from: 'aaharayojan@gmail.com',
		to: donorEmail,
		subject: 'Donation accepted',
		text: "Hello, "  + 
		"\n Thank you for your valuable donation! \n Your donation request has been accepted by the admin and will be prosessed further with agent allocation soon. \n Please keep a track of the request. \n Details are - \n Food Type :"
		+ donation.foodType + "\n Quantity :" + donation.quantity + "\n Cooking Time :" + donation.cookingTime
		+ "\n Address :" + donation.address + "\n Phone Number :" + donation.phone + "\n Expiration Time :" + donation.donorToAdminMsg + "\n Thank you, Regards\n Aahar Ayojan!" 
	};
	
	transporter.sendMail(message, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});


		req.flash("success", "Donation accepted successfully");
		res.redirect(`/admin/donation/view/${donationId}`);
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donation/reject/:donationId", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const donationId = req.params.donationId;
		await Donation.findByIdAndUpdate(donationId, { status: "rejected" })


		.populate("donor")
		.populate("agent");
		const donation = await Donation.findById(donationId);
	  const donorId = donation.donor

	  
	  const donorUser = await User.findById(donorId);
	  
	  const donorEmail = donorUser.email;
	  const donorName = donorUser.firstName + " " + donorUser.lastName;

	  const transporter = await nodemailer.createTransport({
		service:"gmail", 
		auth: {
		  user: 'aaharayojan@gmail.com',
		  pass: 'lwxdqyxmdwpvvufp',
		},
	})
		
	const message = {
		from: 'aaharayojan@gmail.com',
		to: donorEmail,
		subject: 'Donation rejected',
		text: "Hello," +  
		"\n Thank you for the donation request. \n But due to some unavoidable circumstances your donation request has been rejected. We apologize for any inconvinience if occured. \n Thank you, Regards \n Aahar ayojan" 
	};
	
	transporter.sendMail(message, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});

		req.flash("success", "Donation rejected successfully");
		res.redirect(`/admin/donation/view/${donationId}`);
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donation/assign/:donationId", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const donationId = req.params.donationId;
		const agents = await User.find({ role: "agent" });
		const donation = await Donation.findById(donationId).populate("donor");
		res.render("admin/assignAgent", { title: "Assign agent", donation, agents });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.post("/admin/donation/assign/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const donationId = req.params.donationId;
		const { agent, adminToAgentMsg } = req.body;
		await Donation.findByIdAndUpdate(
			donationId,
			{ status: "assigned", agent, adminToAgentMsg },
			{ new: true }
		  )
			.populate("donor")
			.populate("agent");
	  const donation = await Donation.findById(donationId);
	  const agentId = donation.agent

	  
	  const agentUser = await User.findById(agentId);
	  
	  const agentEmail = agentUser.email;
	  const agentName = agentUser.firstName + " " + agentUser.lastName;
 	
	//   const { agent, adminToAgentMsg } = req.body;
	//   await Donation.findByIdAndUpdate(
	// 	donationId,
	// 	{ status: "assigned", agent, adminToAgentMsg },
	// 	{ new: true }
	//   )
	// 	.populate("donor")
	// 	.populate("agent");
		
	//const agentEmail = agent.email;

  
	  const transporter = await nodemailer.createTransport({
		service:"gmail", 
		auth: {
		  user: 'aaharayojan@gmail.com',
		  pass: 'lwxdqyxmdwpvvufp',
		},
	})
		
	const message = {
		from: 'aaharayojan@gmail.com',
		to: agentEmail,
		subject: 'Donation Assigned',
		text: "Hello " + agentName + 
		",\n You have been assigned with a donation, details of which are as follows: \n Food Type :"
		+ donation.foodType + "\n Quantity :" + donation.quantity + "\n Cooking Time :" + donation.cookingTime
		+ "\n Address :" + donation.address + "\n Phone Number :" + donation.phone + "\n Expiration Time :" + donation.donorToAdminMsg 
	};
	
	transporter.sendMail(message, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
	
// 	module.exports = {
// 		sendEmailToAgent
// 	};
	  
// 	  /*const mailOptions = {
// 		from: "aaharayojan@gmail.com",
// 		to: agentEmail,
// 		subject: "New Donation Assignment",
// 		text: `A new donation of has been assigned to you.`,
// 	  };*/
  
// 	  //await transporter.sendMail(mailOptions);

	  
  
	  req.flash("success", "Agent assigned successfully");
	  res.redirect(`/admin/donation/view/${donationId}`);
	
}catch (err) {
	  console.log(err);
	  req.flash("error", "Some error occurred on the server.");
	  res.redirect("back");
	}
});

router.get("/admin/agents", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const agents = await User.find({ role: "agent" });
		res.render("admin/agents", { title: "List of agents", agents });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});


router.get("/admin/profile", middleware.ensureAdminLoggedIn, (req,res) => {
	res.render("admin/profile", { title: "My profile" });
});

router.put("/admin/profile", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const id = req.user._id;
		const updateObj = req.body.admin;	// updateObj: {firstName, lastName, gender, address, phone}
		await User.findByIdAndUpdate(id, updateObj);
		
		req.flash("success", "Profile updated successfully");
		res.redirect("/admin/profile");
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
	
});


module.exports = router;