(function(){
  var now=new Date(),date=now.toISOString().slice(0,10);
  var data={
    products:[
      {id:'p1',name:'Cappuccino',type:'Product',code:'COF-001',category:'Coffee',cost:220,price:650},
      {id:'p2',name:'Iced Latte',type:'Product',code:'COF-002',category:'Coffee',cost:260,price:750},
      {id:'p3',name:'Chocolate Cake Slice',type:'Product',code:'CAK-001',category:'Cakes',cost:280,price:700},
      {id:'p4',name:'Chicken Sandwich',type:'Product',code:'FOD-001',category:'Food',cost:390,price:950},
      {id:'p5',name:'Birthday Cake',type:'Service',code:'CAK-010',category:'Cakes',cost:2200,price:4800}
    ],
    modifiers:[{id:'mod1',name:'Coffee Size',required:true,options:[{name:'Regular',price:0},{name:'Large',price:150}]}],
    categories:['Coffee','Tea','Cold Drinks','Pastries','Cakes','Bakery','Food','Add-ons'],
    customers:[{id:'c1',name:'Nimali Perera',phone:'0771234567',email:'nimali@example.com',birthday:'1992-09-18',notes:'Prefers WhatsApp receipts'},{id:'c2',name:'Kasun Silva',phone:'0715550199',email:'kasun@example.com',birthday:'1988-12-04',notes:''}],
    sales:[{id:'s1',receipt:'ORD-0001',orderNumber:'ORD-0001',date:date,createdAt:now.toISOString(),customerId:'c1',payment:'Card',lines:[{name:'Cappuccino',qty:2,price:650,cost:220}],total:1300,cost:440,profit:860,staffId:'u-owner',status:'completed'},{id:'s2',receipt:'ORD-0002',orderNumber:'ORD-0002',date:date,createdAt:now.toISOString(),customerId:'c2',payment:'Cash',lines:[{name:'Chocolate Cake Slice',qty:2,price:700,cost:280}],total:1400,cost:560,profit:840,staffId:'u2',status:'completed'}],
    users:[{id:'u-owner',name:'Business Owner',role:'owner',pin:'1234',active:true,commissionRate:0},{id:'u2',name:'Amaya',role:'cashier',pin:'2345',active:true,commissionRate:5}],
    timeEntries:[],cashShifts:[],supportAudit:[],
    inventory:[{id:'i1',name:'Coffee Beans',sku:'ING-001',type:'Ingredient',unit:'kg',qty:8,reorder:3,cost:3500,supplier:'Ceylon Coffee'},{id:'i2',name:'Fresh Milk',sku:'ING-002',type:'Ingredient',unit:'litre',qty:12,reorder:5,cost:480,supplier:'Local Dairy'}],
    stockMovements:[],voidOrders:[],
    openOrders:[{id:'o1',orderNumber:'ORD-0003',openedAt:now.toISOString(),updatedAt:now.toISOString(),status:'open',staffId:'u-owner',customerId:'c1',orderReference:'Table 4',lines:[{name:'Iced Latte',qty:2,price:750,cost:260}],discount:{type:'percent',value:0,amount:0},kitchenSentAt:now.toISOString()}],
    customerCommunications:[],appointments:[],memberships:[],prescriptions:[],medicineBatches:[],commissionPayments:[],
    settings:{business:'Ceylon Cafe Demo',email:'hello@demo.lk',address:'Colombo, Sri Lanka',feedbackLink:'https://example.com',feedbackDelay:2,businessType:'cafe',onboardingComplete:true,ownerAuth:{email:'demo@example.com',passwordHash:'demo'},autoPrint:false,autoPrintKot:true,receiptFooter:'Thank you for visiting!'}
  };
  localStorage.setItem('ceylonry-pos-v1',JSON.stringify(data));
  sessionStorage.setItem('ceylonry-business-auth','1');
  sessionStorage.setItem('ceylonry-pos-user','u-owner');
})();
