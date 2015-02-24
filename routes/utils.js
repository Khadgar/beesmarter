var writeHead = function(res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
};


exports.writeHead = writeHead;