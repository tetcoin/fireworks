var commandLineArgs = require('command-line-args'),
    commandLineUsage = require('command-line-usage'),
    request = require("request"),
    _ = require("lodash"),
    async = require("async")

var defOpt = [
  {name: "hosts", alias:"s", type:String, description: "Comma-separated list of RPC addresses"},
  {name: "help", alias: "h",  description: "Print usage"}
], opts = commandLineArgs(defOpt)

if(opts.help || !opts.hosts){
  console.log(commandLineUsage([
    {
      header: "PoA cluster: connect nodes",
      content: "Connect nodes in a cluster"
    },
    {
      optionList: defOpt
    }
  ]))

  process.exit(-1)
}

var hostnames = opts.hosts.split(",")

async.map(hostnames, (rpcHost, done) => {
  request.post("http://"+rpcHost, {
    json: {
      jsonrpc: "2.0",
      method: "parity_enode",
      id: 1
    }
  }, (err, res, body) => {
    if(err) throw err

    done(body.error, body.result)
  })
}, (err, enodes) => {
  if(err) throw err
    
  async.each(hostnames, (host, done)=>{
    async.each(enodes, (enode, done) => {
      request.post("http://"+host, {
        json: {
          jsonrpc: "2.0",
          method: "parity_addReservedPeer",
          id:1,
          params: [enode]
        }
      }, (err, res, body) => {
        if(!err) console.log(`connected ${host.split(":")[0]} to ${enode}`)
        console.log(body)
        done(err)
      })
    }, done)
  }, (err) => {
    if(err) throw err

    console.log("Done")
  })
})
