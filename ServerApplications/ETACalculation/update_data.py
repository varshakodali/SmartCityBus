import pymongo

def change_eta










if __name__=="__main__":
	client=pymongo.MongoClient('localhost',27017)
	database=client.VtaDailyTrips
	tdata=database.Trips
	trip_1=tdata.find_one()
	value=int(raw_input('enter the  minutes'))
	change_eta(trip_1,value)
