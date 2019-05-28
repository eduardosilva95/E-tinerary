import googlemaps
import urllib, json
import mysql.connector
import wikipedia
import sys

API_KEY = 'AIzaSyCcM_AepOJRN1QIx96d2n0FOfOcGfZYfck'

mydb = mysql.connector.connect(
  host="localhost",
  user="root",
  passwd="password",
  auth_plugin='mysql_native_password',
  database="placesdb"
)

mycursor = mydb.cursor()

def readCitiesFromFile():

	cities = []

	with open("list_cities.txt", 'r') as f:
		line = f.readline()

		while line:
			cities = cities + [line.strip()]
			line = f.readline()

	return cities


def requestInfoCity(city):
	url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + city + '&key=' + API_KEY

	response = urllib.request.urlopen(url)
	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)

	city = jsonData['results'][0]['name']
	country = jsonData['results'][0]['formatted_address'].split(',')[-1]
	lat = jsonData['results'][0]['geometry']['location']['lat']
	lon = jsonData['results'][0]['geometry']['location']['lng']

	res = "City: {0} | Country: {1} | Lat: {2} | Long: {3}".format(city, country, lat, lon)
	print(res)

	return city, country, lat, lon


def requestInfoPlace(place):
	url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + place + '&key=' + API_KEY

	print(url)

	response = urllib.request.urlopen(url)

	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)


	results = jsonData['results']

	list_results = []

	count = 1


	if len(results) > 0:
		for result in results:
			place = result['name']
			place_id = result['place_id']
			place_type = result['types'][0]
			city = ''.join([i for i in result['formatted_address'].split(',')[-2] if i.isalpha()]) 

			res = "{0}) Place ID: {1} | Place: {2} | Type: {3} | City: {4} ".format(count, place_id, place, place_type, city)
			print(res)


			list_results.append((place_id, place_type, city))

			count = count + 1


	return list_results



def requestHotels(lat, lon, places_dict):
	url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?location=' + str(lat) + ',' + str(lon) + '&radius=20000&type=lodging&key=' + API_KEY  

	response = urllib.request.urlopen(url)
	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)

	for place in jsonData['results']:
		if place['place_id'] not in places_dict.keys():
				places_dict[place['place_id']] = (place['name'], 'Hotel')

	return places_dict

def requestRestaurants(lat, lon, places_dict):
	url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?location=' + str(lat) + ',' + str(lon) + '&radius=20000&type=restaurant&key=' + API_KEY  

	response = urllib.request.urlopen(url)
	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)


	for place in jsonData['results']:
		if place['place_id'] not in places_dict.keys():
			places_dict[place['place_id']] = (place['name'], 'Restaurant')

	return places_dict


def requestParks(lat, lon, places_dict):
	url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?location=' + str(lat) + ',' + str(lon) + '&radius=20000&type=park&key=' + API_KEY  

	response = urllib.request.urlopen(url)
	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)

	for place in jsonData['results']:
		if place['place_id'] not in places_dict.keys():
			places_dict[place['place_id']] = (place['name'], 'Park')

	return places_dict

def requestShops(lat, lon, places_dict):
	url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?location=' + str(lat) + ',' + str(lon) + '&radius=10000&query=shop&key=' + API_KEY  

	response = urllib.request.urlopen(url)
	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)

	for place in jsonData['results']:
		if place['place_id'] not in places_dict.keys():
			places_dict[place['place_id']] = (place['name'], 'Shop')

	return places_dict

def requestPOIs(lat, lon, places_dict):
	url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?location=' + str(lat) + ',' + str(lon) + '&radius=20000&query=tower&key=' + API_KEY  

	response = urllib.request.urlopen(url)
	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)

	for place in jsonData['results']:
		if place['place_id'] not in places_dict.keys():
			places_dict[place['place_id']] = (place['name'], 'Tower')


	url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?location=' + str(lat) + ',' + str(lon) + '&radius=20000&query=castle&key=' + API_KEY  

	response = urllib.request.urlopen(url)
	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)

	for place in jsonData['results']:
		if place['place_id'] not in places_dict.keys():
			places_dict[place['place_id']] = (place['name'], 'Castle')

	url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?location=' + str(lat) + ',' + str(lon) + '&radius=20000&type=church&key=' + API_KEY  

	response = urllib.request.urlopen(url)
	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)

	for place in jsonData['results']:
		if place['place_id'] not in places_dict.keys():
			places_dict[place['place_id']] = (place['name'], 'Church')

	url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?location=' + str(lat) + ',' + str(lon) + '&radius=20000&type=museum&key=' + API_KEY  

	response = urllib.request.urlopen(url)
	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)

	for place in jsonData['results']:
		if place['place_id'] not in places_dict.keys():
			places_dict[place['place_id']] = (place['name'], 'Museum')

	return places_dict


def requestPlaces(lat, lon):
	places_dict = {}				

	places_dict = requestHotels(lat,lon,places_dict)
	
	places_dict = requestRestaurants(lat,lon,places_dict)

	places_dict = requestParks(lat,lon,places_dict)
	
	#requestShops(lat,lon,places_dict)
	
	places_dict = requestPOIs(lat,lon, places_dict)

	return places_dict


def getDetails(place_id):
	
	url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + place_id +'&key=' + API_KEY

	response = urllib.request.urlopen(url)
	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)

	jsonData = jsonData['result']

	name = jsonData['name']
	lat = jsonData['geometry']['location']['lat']
	lon = jsonData['geometry']['location']['lng']
	address = jsonData['formatted_address']

	if 'website' in jsonData.keys():
		website = jsonData['website']
	else:
		website = None

	if 'formatted_phone_number' in jsonData.keys():
		phone_number = jsonData['formatted_phone_number']
	else:
		phone_number = None

	if 'rating' in jsonData.keys():
		rating = jsonData['rating']
	else:
		rating = None

	if 'user_ratings_total' in jsonData.keys():
		num_reviews = jsonData['user_ratings_total']
	else:
		num_reviews = 0

	return name, lat, lon, address, website, phone_number, rating, num_reviews


def getAddressFromPlace(place_id):

	url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + place_id +'&key=' + API_KEY + '&fields=formatted_address'

	response = urllib.request.urlopen(url)
	jsonRaw = response.read()
	jsonData = json.loads(jsonRaw)

	address = ""

	if 'result' in jsonData:
		jsonData = jsonData['result']
		address = jsonData['formatted_address']

	return address



def getInfoFromWikipedia(city):
	return wikipedia.summary(city)


def addCityToDB(city):
		city, country, lat, lon = requestInfoCity(city)

		description = ""
		try:
			description = getInfoFromWikipedia(city)
		except:
			try:
				description = getInfoFromWikipedia(city + ", " + country)
			except:
				description = ""


		sql = "INSERT INTO City (name, country, description, latitude, longitude, my_rating, num_votes) VALUES (%s, %s, %s, %s, %s, 0, 0)"
		val = (city, country, description, lat, lon)
		mycursor.execute(sql, val)

		mydb.commit()

		print("1 record inserted, ID:", mycursor.lastrowid)

		return mycursor.lastrowid, lat, lon




def addPlacetoDB(place_id, poi_type, city):
	try:
		name, lat, lon, address, website, phone_number, rating, num_reviews = getDetails(place_id)

		description = ""
		try:
			description = getInfoFromWikipedia(name)
		except:
			description = ""


		if website == None and phone_number == None and rating == None:
			sql = "INSERT INTO POI (place_id, name, description, latitude, longitude, address, poi_type, num_reviews, city) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
			val = (place_id, name, description, lat, lon, address, poi_type, num_reviews, city)

		elif website == None and phone_number == None:
			sql = "INSERT INTO POI (place_id, name, description, latitude, longitude, address, poi_type, rating, num_reviews, city) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
			val = (place_id, name, description, lat, lon, address, poi_type, rating, num_reviews, city)

		elif phone_number == None and rating == None:
			sql = "INSERT INTO POI (place_id, name, description, latitude, longitude, address, poi_type, website, num_reviews, city) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
			val = (place_id, name, description, lat, lon, address, poi_type, website, num_reviews, city)

		elif website == None and rating == None:
			sql = "INSERT INTO POI (place_id, name, description, latitude, longitude, address, poi_type, phone_number, num_reviews, city) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
			val = (place_id, name, description, lat, lon, address, poi_type, phone_number, num_reviews, city)

		elif website == None:
			sql = "INSERT INTO POI (place_id, name, description, latitude, longitude, address, poi_type, phone_number, rating, num_reviews, city) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
			val = (place_id, name, description, lat, lon, address, poi_type, phone_number, rating, num_reviews, city)

		elif phone_number == None:
			sql = "INSERT INTO POI (place_id, name, description, latitude, longitude, address, poi_type, website, rating, num_reviews, city) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
			val = (place_id, name, description, lat, lon, address, poi_type, website, rating, num_reviews, city)

		elif rating == None:
			sql = "INSERT INTO POI (place_id, name, description, latitude, longitude, address, poi_type, website, phone_number, num_reviews, city) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
			val = (place_id, name, description, lat, lon, address, poi_type, website, phone_number, num_reviews, city)

		else:
			sql = "INSERT INTO POI (place_id, name, description, latitude, longitude, address, poi_type, website, phone_number, rating, num_reviews, city) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
			val = (place_id, name, description, lat, lon, address, poi_type, website, phone_number, rating, num_reviews, city)


		mycursor.execute(sql, val)

		mydb.commit()

		print("1 record inserted, ID:", mycursor.lastrowid)

	except:
		pass
	


if __name__== "__main__":

	# request a place with its name
	if len(sys.argv) == 4 and sys.argv[1] == 'place':
		try:

			place = sys.argv[2].replace("_", " ")

			list_results = requestInfoPlace(place)

			index = int(input("Place: "))

			(place, place_type, city) = list_results[index-1]

			city = sys.argv[3].replace("_", " ")

			print(city)

			sql = """SELECT id FROM City WHERE name = '%s' """ % (city)

			mycursor.execute(sql)

			city_id = mycursor.fetchone()[0]

			inp = input("Add to the DB (y/n): ")

			if inp == 'y':	
				addPlacetoDB(place, place_type, city_id)

		except:
			pass

	# request places of a city
	elif len(sys.argv) == 3 and sys.argv[1] == 'city':
		try:
			city = sys.argv[2]

			city_id, lat, lon = addCityToDB(city)

			places = requestPlaces(lat, lon)

			print(len(places))

			for place in places.keys():
				addPlacetoDB(place, places[place][1], city_id)

		except:
			pass

	# request de um tipo de locais de uma cidade 
	elif len(sys.argv) == 4 and sys.argv[1] == 'citytype':
		
			city = sys.argv[2]
			tpe = sys.argv[3]

			sql = """SELECT id, latitude, longitude FROM City WHERE name = '%s' """ % (city)

			mycursor.execute(sql)

			data = mycursor.fetchall()

			city_id, latitude, longitude = data[0]

			places = {}

			if tpe == 'hotel':
				places = requestHotels(latitude, longitude, places)

			for place in places.keys():
				try:
					addPlacetoDB(place, places[place][1], city_id)
				except:
					pass


	# teste para a UA
	elif len(sys.argv) == 2 and sys.argv[1] == 'ua':

		place_id = 'ChIJsV7ar6qiIw0RbttezXqeR7c'
		name = 'DETI - Departamento de Electrónica, Telecomunicações e Informática'
		description = "The Department of Electronics, Telecommunications and Informatics (DETI) was established in 1974, with the name of Department of Electronics and Telecommunications, being one of the first departments initiating activity after the establishment of the University of Aveiro, in 1973. In 2006, its designation was modified to the present name to reflect the existing activity in the area of Computer Sciences. \n Regarding the human resources, DETI has 76 faculty, from which 100% possesses a PhD Degree, and 14 technical and administrative employees. It is installed in a 5,000 m² area building, essentially allocated to teaching and research and development activities. \n The diploma in Electronics and Telecommunications Engineering, a degree with a well-known reputation, which has, at the moment, a numerous clausus of 80 students, was the first engineering diploma offered by DETI. Later, the offer regarding the initial education level of Engineering was extended with the creation of the diploma in Computer and Telematics Engineering, which has, presently, a numerous clausus of 80 students."
		lat = 40.63317310000001
		lon = -8.659493299999999
		address = 'Aveiro, 3810-193 Aveiro, Portugal'
		poi_type = 'Department'
		website = 'https://www.ua.pt/deti/'
		phone_number = '234 370 355'
		rating = 4.7
		num_reviews = 19
		city = 170

		try:

			sql = "INSERT INTO POI (place_id, name, description, latitude, longitude, address, poi_type, website, phone_number, rating, num_reviews, city) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
			val = (place_id, name, description, lat, lon, address, poi_type, website, phone_number, rating, num_reviews, city)

			mycursor.execute(sql, val)

			mydb.commit()

			print("1 record inserted, ID:", mycursor.lastrowid)

		except:
			pass


	#update da DB
	elif len(sys.argv) == 2 and sys.argv[1] == 'db':
		sql = """SELECT id, name, place_id FROM poi where id > 5064""";

		mycursor.execute(sql)

		data = mycursor.fetchall()

		for poi in data:
			poi_id = poi[0]
			poi_name = poi[1]
			poi_place_id = poi[2]

			address = getAddressFromPlace(poi_place_id)

			description = ""
			try:
				description = getInfoFromWikipedia(poi_name)
			except:
				description = ""

			try:
				sql = """UPDATE POI SET address = '%s' WHERE id = '%s'""" % (address, poi_id)

				mycursor.execute(sql)
				mydb.commit()

				sql = """UPDATE POI SET description = '%s' WHERE id = '%s'""" % (description, poi_id)

				mycursor.execute(sql)
				mydb.commit()

				print(poi_name, " updated")

			except Exception as ex:
				print(ex)


	#request para todas as cidades de um ficheiro
	elif len(sys.argv) == 1:
		for city in readCitiesFromFile():
			try:
				city_id, lat, lon = addCityToDB(city)

				places = requestPlaces(lat, lon)

				print(len(places))

				for place in places.keys():
					addPlacetoDB(place, places[place][1], city_id)

			except:
				pass

