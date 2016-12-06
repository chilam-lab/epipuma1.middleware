select 
	count(*) as registro 
from user_mail 
where email = $<email>