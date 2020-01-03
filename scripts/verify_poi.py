# Script to verify if all POI of a city are in a MAX_DISTANCE in kilometers of the center of the city


import mysql.connector
import sys
import math

MAX_DISTANCE_KM = 20

mydb = mysql.connector.connect(
  host="database host name",
  user="database username",
  passwd="database password",
  auth_plugin='mysql_native_password',
  database="database name"
)

mycursor = mydb.cursor()

def degreesToRadians(degrees):
	return degrees * math.pi / 180;


def checkDistance(city_lat, city_lon, poi_lat, poi_lon):
	earthRadiusKm = 6371


	city_lat = float(city_lat)
	city_lon = float(city_lon)
	poi_lat = float(poi_lat)
	poi_lon = float(poi_lon)

	diff_lat = degreesToRadians(city_lat - poi_lat)
	diff_lon = degreesToRadians(city_lon - poi_lon)

	l1 = poi_lat
	l2 = city_lat

	a = math.sin(diff_lat/2) * math.sin(diff_lat/2) + math.sin(diff_lon/2) * math.sin(diff_lon/2) * math.cos(l1) * math.cos(l2)
	c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

	distance = earthRadiusKm * c

	return distance <= MAX_DISTANCE_KM


def getCities():
	sql = """SELECT id, latitude, longitude, name FROM City  """

	mycursor.execute(sql)

	results = mycursor.fetchall()

	list_cities = [result for result in results]

	return list_cities


def getPOIFromCity(city_id):
	sql = """SELECT id, latitude, longitude, name FROM poi where city = '%s' """ % (city_id)

	mycursor.execute(sql)

	results = mycursor.fetchall()

	list_pois = [result for result in results]

	return list_pois


def removePOI(poi_id):
	sql = "DELETE FROM poi WHERE id = '%s' """ % (poi_id)
			
	mycursor.execute(sql)

	mydb.commit()

	print(mycursor.rowcount, "record(s) deleted")




if __name__== "__main__":

	list_cities = getCities()

	for city in list_cities:
		list_pois = getPOIFromCity(city[0])

		for poi in list_pois:
			if not checkDistance(city[1], city[2], poi[1], poi[2]):
				removePOI(poi[0])
				print('Removing ' + poi[3] + ' from ' + city[3])
