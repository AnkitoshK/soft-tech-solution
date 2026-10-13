const {env,auth,supabaseHeaders,supabaseUrl}=require('./_utils');
function safe(v,max=5000){ return typeof v==='string' ? v.trim().slice(0,max) : ''; }
async function sb(url,opts={}){ const r=await fetch(url,{...opts,headers:{...supabaseHeaders(),...(opts.headers||{})}}); const text=await r.text(); let data; try{data=text?JSON.parse(text):null}catch{data=text}; return {r,data}; }
module.exports=async(req,res)=>{
  try{
    if(req.method==='POST'){
      const body=req.body||{};
      const name=safe(body.name,120), email=safe(body.email,180), phone=safe(body.phone,40), service=safe(body.service,120), message=safe(body.message,5000);
      if(!name || !email) return res.status(400).json({error:'Name and email are required.'});
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({error:'Please enter a valid email.'});
      const {r,data}=await sb(supabaseUrl('enquiries'),{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name,email,phone,service,message,status:'New'})});
      if(!r.ok) return res.status(500).json({error:'Could not save enquiry.',details:data});
      return res.status(201).json({ok:true,id:data?.[0]?.id});
    }
    if(!auth(req)) return res.status(401).json({error:'Unauthorized'});
    if(req.method==='GET'){
      const q=new URL(req.url,'http://localhost').searchParams;
      const status=q.get('status');
      let url=supabaseUrl(`enquiries?select=*&order=created_at.desc&limit=500`);
      if(status && status!=='All') url=supabaseUrl(`enquiries?select=*&status=eq.${encodeURIComponent(status)}&order=created_at.desc&limit=500`);
      const {r,data}=await sb(url);
      if(!r.ok) return res.status(500).json({error:'Could not load enquiries.',details:data});
      return res.status(200).json(data||[]);
    }
    const id=new URL(req.url,'http://localhost').searchParams.get('id');
    if(!id) return res.status(400).json({error:'Missing enquiry id'});
    if(req.method==='PATCH'){
      const body=req.body||{}; const update={};
      if(body.status) update.status=safe(body.status,30);
      if(body.notes!==undefined) update.notes=safe(body.notes,5000);
      if(!Object.keys(update).length) return res.status(400).json({error:'Nothing to update'});
      const {r,data}=await sb(supabaseUrl(`enquiries?id=eq.${encodeURIComponent(id)}`),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(update)});
      if(!r.ok) return res.status(500).json({error:'Could not update enquiry.',details:data});
      return res.status(200).json(data?.[0]||null);
    }
    if(req.method==='DELETE'){
      const {r,data}=await sb(supabaseUrl(`enquiries?id=eq.${encodeURIComponent(id)}`),{method:'DELETE',headers:{Prefer:'return=minimal'}});
      if(!r.ok) return res.status(500).json({error:'Could not delete enquiry.',details:data});
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:'Method not allowed'});
  }catch(e){return res.status(500).json({error:e.message||'Server error'});}
};
