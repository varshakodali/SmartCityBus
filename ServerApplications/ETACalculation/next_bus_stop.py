import distance_calculation
import pymongo

def next_bus_stop(stop_data):
	back_up=stop_data
	minimum_distance_1=9999999999999999
	minimum_distance_2=9999999999999999
	nearest_stop_data_1=stop_data['stop_seq'][0]
	nearest_stop_data_2=stop_data['stop_seq'][0]
	current_location=stop_data['currentLoc']
	#current_location=stop_data['stop_seq'][0]['loc']
	for i in range (len(stop_data['stop_seq'])):
		bus_stop=stop_data['stop_seq'][i]['loc']
		stop_distance=distance_calculation.distance_calculation(bus_stop,current_location)
  		if (stop_distance<minimum_distance_1):
			minimum_distance_1=stop_distance
			nearest_stop_data_1=stop_data['stop_seq'][i]
			nearest_stop_number_1=i

	stop_data['stop_seq'].remove(stop_data['stop_seq'][nearest_stop_number_1])

	for j in range (len(stop_data['stop_seq'])):
		bus_stop=stop_data['stop_seq'][j]['loc']
		stop_distance=distance_calculation.distance_calculation(bus_stop,current_location)
  		if (stop_distance<minimum_distance_2):
			minimum_distance_2=stop_distance
			nearest_stop_data_2=stop_data['stop_seq'][j]
			nearest_stop_number_2=j
	
	if (nearest_stop_number_1>nearest_stop_number_2):
		return nearest_stop_data_1
	else:
		return nearest_stop_data_2


if __name__=='__main__':
	client=pymongo.MongoClient('localhost',27017)
	database=client.VtaDailyTrips
	trip_1=database.Trips
	some_variable=trip_1.find_one()
	answer=next_bus_stop(some_variable)
	print answer		
