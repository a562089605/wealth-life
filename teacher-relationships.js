// Course identity and original term persist after graduation; no retroactive contacts.
(function(root){'use strict';
 function enroll(s,st){if(st.version!==4)return;const id='relationship-teacher-'+st.id;s.people??=[];if(s.people.some(p=>p.id===id))return;const gender=Math.random()<.5?'female':'male',label=['master','doctorate'].includes(st.target)?'导师':'老师',names=gender==='female'?['林老师','陈老师','许老师','苏老师','江老师']:['周老师','李老师','王老师','赵老师','何老师'];const name=names.find(n=>!s.people.some(p=>p.name===n))||label+(s.people.length+1);s.people.push({id,name,gender,relationshipRole:'teacher',teacherLabel:label,status:'教师',origin:'school',job:label,education:'未记录',studyProjectId:st.id,relation:10,metMonth:s.month,lastContactMonth:s.month,city:s.city});}
 root.TeacherRelationships={enroll};
})(typeof window==='undefined'?globalThis:window);
