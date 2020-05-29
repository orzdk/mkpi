var mongoose = require('mongoose');

var SysexRecordSchema = new mongoose.Schema({ 
	user:String,
	scene:String,
	sysex: { type: Array, default: [] }
}, { collection: 'SysexRecord' });

module.exports = mongoose.model('SysexRecord', SysexRecordSchema);
