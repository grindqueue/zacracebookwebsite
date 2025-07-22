const jwt = require('jsonwebtoken');
const User = require('../models/usermodels');
require('dotenv').config();

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
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenRes.data;

    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { name, email, id: providerId } = profileRes.data;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: profile,
        email,
        provider: 'google',
        providerId: profile.data.id,
        isVerified: true,

      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(200).json({ token });

  } catch (err) {
    console.error('Google OAuth Error:', err?.response?.data || err.message);
    res.status(500).json({ message: 'Google login failed' });
  }
};

module.exports = { 
    createGoogleLink,
    googleCallback 
};