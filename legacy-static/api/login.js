const {env,signToken,setCookie,clearCookie} = require('./_utils');
module.exports = async (req,res)=>{
  if(req.method==='GET') return res.status(200).json({authenticated:false});
  if(req.method==='DELETE'){ clearCookie(res); return res.status(200).json({ok:true}); }
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try {
    const {email,password}=req.body||{};
    if(email!==env('ADMIN_EMAIL') || password!==env('ADMIN_PASSWORD')) return res.status(401).json({error:'Invalid email or password'});
    const token=signToken({sub:email,exp:Math.floor(Date.now()/1000)+28800});
    setCookie(res,token); return res.status(200).json({ok:true});
  } catch(e){ return res.status(500).json({error:'Server configuration error'}); }
};
