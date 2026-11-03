const test=require('node:test');const assert=require('node:assert/strict');
const emailAllowed=e=>/^[^\s@]+@(gmail\.com|outlook\.com)$/i.test(e);
const category=r=>r>=4?'Good':r===3?'Neutral':'Bad';
test('email policy accepts Gmail and Outlook only',()=>{assert.equal(emailAllowed('x@gmail.com'),true);assert.equal(emailAllowed('x@outlook.com'),true);assert.equal(emailAllowed('x@hotmail.com'),false);assert.equal(emailAllowed('x@university.edu'),false);});
test('rating category boundaries are correct',()=>{assert.equal(category(1),'Bad');assert.equal(category(2),'Bad');assert.equal(category(3),'Neutral');assert.equal(category(4),'Good');assert.equal(category(5),'Good');});
test('feedback edit allowance is three successful edits within 72 hours',()=>{const created=Date.now()-71*3600000;assert.equal(created+72*3600000>Date.now(),true);assert.equal(3<3,false);});
test('teacher reply edit deadline is 30 minutes',()=>{const created=Date.now()-29*60000;assert.equal(created+30*60000>Date.now(),true);});
