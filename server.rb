require 'webrick'

HTML_PATH = File.expand_path('../VolaremosDashboard.html', __FILE__)

server = WEBrick::HTTPServer.new(Port: 3000, Logger: WEBrick::Log.new('/dev/null'), AccessLog: [])

server.mount_proc '/' do |req, res|
  res.content_type = 'text/html; charset=utf-8'
  res.body = File.read(HTML_PATH)
end

trap('INT') { server.shutdown }
server.start
