import pymongo
import update_data
import pprint


client=pymongo.MongoClient('localhost',27017)
database=client.VtaDailyTrips
trip_1=database.Trips
trip_data=trip_1.find_one()
#pprint.pprint(trip_data)
#bingbong chingchong dingdong mingmong tingtong singsong pingpong zingzong
updated_trip_data=update_data.update_data(trip_data)


