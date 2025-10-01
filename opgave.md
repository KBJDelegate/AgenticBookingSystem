Tjenester:
1 Shared kalender per tjeneste 
- Der er forskellige ejere af tjenenster i forretnignen. 
- Forskellige managers kan styre disse shared kalender (internt i forretningen hos IT)
- I systememt kan vi mappe / liste de shared kalender som udstiller tjenester
 
 
Har vi medarbejder der kan bookes.
- En medarbejder kan have sin primær kalender, + 1-n shared kalender der presentere brands.
- Torben har torben@kunde.dk og torben@brand.dk (shared)
 
 
Har vi kundens kunder.
- De går på brand.dk og skal booke:
  - De skan se ud fra tjenester shared kalender hvad der kan bookes.
  - Når de vælger en tjeneste, så skal vi check hvilke ledige tidspuntker er der på brand.dk (shared kalender) for medbrejder i det tidsrum tjeneste shared kalender tilddage.

 
 
settings.json file
 
{
 
  "tjenester":[
  		{
  		  "calender":"id/url",
  		  "navn", "descreipt"
  		}
  ],
  "employees":
  [
  {
  		id:"torben@kunde.dk",
  		"brands":[
  			{"torben@kunde.dk"},
  			{"torben@brand.dk"}
  		]
  }]
 
}
 


Her er et konkret eksempel som jeg føler forklarer det meget godt:

Jeg fik lige chatten til at hjælpe mig med at specificere og føler det her giver god mening:
	Primærkalender: torben@kunde.dk (hans egen Outlook/Google med møder/ferie).
	Afdelings-/Brand-kalendere:
		hr@kunde.dk (HR-afdelingen)
		it@kunde.dk (IT-afdelingen)
	Tjeneste-kalendere:
		onboarding@kunde.dk (tjeneste: onboarding-møde)
		support@kunde.dk (tjeneste: teknisk support)
Når en kunde går ind på HR-afdelingens booking-side:
	De vælger Onboarding-møde.
	Systemet tjekker:
		Er Onboarding-tjenesten åben i sin shared kalender?
		Er HR-afdelingen åben i sin kalender?
		Er Torben ledig i sin primærkalender
Hvis ja → slot er bookbart.


Selve applikationen skal bygges om så den bruger shadcn ui library og nextjs app router