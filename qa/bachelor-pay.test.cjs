const fs=require('fs'),vm=require('vm'),path=require('path'),a=require('node:assert/strict'),{test}=require('node:test');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
function context(s){const c={state:s,roundCash:n=>Math.round(n*100)/100};vm.createContext(c);vm.runInContext(read('core.js').split('\n')[0],c);const pay=read('coffee-salary.js');vm.runInContext(pay.slice(0,pay.indexOf('const paySkillBefore')),c);return c;}
test('all coffee career payrolls retain a new bachelor raise on actual current salary',()=>{
 for(const job of ['咖啡师','值班主管','店长','管理合伙人']){
  const s={job,month:0,education:'associate',salary:3000,annualSalary:36000},c=context(s);c.captureCoffeePayMilestones(s);
  s.education='bachelor';s.salary=3360;s.annualSalary=40320;c.preserveCoffeeEducationRaise(s);
  s.month=1;a.equal(c.applyCoffeeSalaryForNextMonth({}),true);a.equal(s.salary,3360,job);
  a.equal(c.applyCoffeeSalaryForNextMonth({}),false);a.equal(s.salary,3360,job);
  s.month=2;c.applyCoffeeSalaryForNextMonth({});a.equal(s.salary,3360,job);
 }
});
test('associate then bachelor compounds 8 percent and 12 percent, rather than replacing 8',()=>{
 const s={job:'咖啡师',month:0,education:'associate',salary:2880,annualSalary:34560},c=context(s);c.captureCoffeePayMilestones(s);
 s.education='bachelor';s.salary=3225.6;s.annualSalary=38707.2;c.preserveCoffeeEducationRaise(s);s.month=1;c.applyCoffeeSalaryForNextMonth({});a.equal(s.salary,3225.6);
 const loaded=JSON.parse(JSON.stringify(s)),next=context(loaded);loaded.month=2;next.applyCoffeeSalaryForNextMonth({});a.equal(loaded.salary,3225.6);
});
test('legacy degree pay is not retroactively converted to the new compound formula',()=>{
 const s={job:'咖啡师',month:3,education:'bachelor',salary:2986.67,annualSalary:35840,educationRaises:{bachelor:{month:2,rate:.12}}},c=context(s),prior=JSON.stringify(s.educationRaises);
 c.captureCoffeePayMilestones(s);a.equal(c.coffeeAnnualPay(s),35840);a.equal(s.coffeePay.educationAdjustment,undefined);a.equal(s.salary,2986.67);a.equal(JSON.stringify(s.educationRaises),prior);
});

test('new master reward compounds on earned bachelor pay and survives payroll/reload',()=>{
 const s={job:'咖啡师',month:1,education:'bachelor',salary:3225.6,annualSalary:38707.2},c=context(s);c.captureCoffeePayMilestones(s);c.preserveCoffeeEducationRaise(s);
 s.education='master';s.salary=3806.21;s.annualSalary=45674.52;c.preserveCoffeeEducationRaise(s);s.month=2;c.applyCoffeeSalaryForNextMonth({});a.equal(s.salary,3806.21);
 const old=context(JSON.parse(JSON.stringify(s)));old.state.month=3;old.applyCoffeeSalaryForNextMonth({});a.equal(old.state.salary,3806.21);
});

test('doctorate gives 25 percent on current wage for every coffee role, without changing legacy professional pay',()=>{
 for(const job of ['咖啡师','值班主管','店长','管理合伙人']){
  const s={job,month:2,education:'master',salary:3806.21,annualSalary:45674.52},c=context(s);c.captureCoffeePayMilestones(s);c.preserveCoffeeEducationRaise(s);
  s.education='doctorate';s.salary=4757.76;s.annualSalary=57093.12;c.preserveCoffeeEducationRaise(s);s.month=3;c.applyCoffeeSalaryForNextMonth({});a.equal(s.salary,4757.76,job);s.month=4;c.applyCoffeeSalaryForNextMonth({});a.equal(s.salary,4757.76,job);
 }
 const legacy={job:'咖啡师',month:4,education:'professional',salary:3333.33,annualSalary:40000},c=context(legacy);a.equal(c.coffeeAnnualPay(legacy),40000);a.equal(legacy.education,'professional');a.equal(legacy.salary,3333.33);
});

test('earned education multiplier follows promotions without granting the degree twice',()=>{
 const s={job:'咖啡师',month:0,education:'associate',salary:2880,annualSalary:34560},c=context(s);c.captureCoffeePayMilestones(s);
 s.education='bachelor';s.salary=3225.6;s.annualSalary=38707.2;c.preserveCoffeeEducationRaise(s);
 const adjustment=s.coffeePay.educationAdjustment;
 for(const [job,base] of [['值班主管',44000],['店长',58000],['管理合伙人',60000]]){
  const beforeMonth=s.month;s.job=job;s.month++;c.applyCoffeeSalaryForNextMonth({});
  a.equal(s.annualSalary,Math.round(base*1.08*1.12*100)/100,job);a.equal(s.coffeePay.educationAdjustment,adjustment);a.equal(s.month,beforeMonth+1);
  const loaded=JSON.parse(JSON.stringify(s)),next=context(loaded);loaded.month++;next.applyCoffeeSalaryForNextMonth({});a.equal(loaded.salary,s.salary,job);
 }
});
