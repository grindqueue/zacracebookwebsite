const jwt = require('jsonwebtoken');
const User = require('../models/usermodels');
require('dotenv').config();
const axios = require('axios');

const createGoogleLink = (req, res) => {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const clientId = process.env.GOOGLE_Client_ID;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile&access_type=offline&prompt=consent`;
    res.redirect(url);
}


const googleCallback = async (req, res) => {
  const { code } = req.query;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  try {
    if (!code) {
      return res.status(400).json({ message: "Missing authorization code" });
    }

    const params = new URLSearchParams();
    params.append('client_id', process.env.GOOGLE_CLIENT_ID);
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');
    console.log("redirectUri", redirectUri);

    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (tokenRes.data.error) {
      console.error("Google Token Error:", tokenRes.data);
      return res.status(400).json({ message: "Token exchange failed", details: tokenRes.data });
    }

    const { access_token } = tokenRes.data;

    if (!access_token) {
      throw new Error('No access token received from Google');
    }

    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { name, email, id: providerId } = profileRes.data;

    if (!email) {
      return res.status(400).json({ message: "Google account does not include email" });
    }

    let user = await User.findOne({ email });

    if (user && user.provider !== 'google') {
      return res.status(400).json({ message: "Email already registered with a different provider, sign in normally" });
    }

    if (!user) {
      user = await User.create({
        name,
        email,
        provider: 'google',
        providerId,
        isVerified: true,
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({ 
      message: "Google login successful",
      token, 
      user:{
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    console.error('Google OAuth Error:', err?.response?.data || err.message || err);
    return res.status(500).json({ message: 'Google login failed' });
  }
};



module.exports = { 
    createGoogleLink,
    googleCallback 
};