export default function(req,res){
    console.log(req.params)
    return res.json({message: req.url})
}