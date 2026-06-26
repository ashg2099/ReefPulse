import requests
import json

def get_noaa_dhw(lat=-18.156290, lon=147.485962):
    base = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/NOAA_DHW.json"
    query = (
        f"?CRW_DHW[(last)][({lat}):1:({lat})][({lon}):1:({lon})]"
        f",CRW_SST[(last)][({lat}):1:({lat})][({lon}):1:({lon})]"
        f",CRW_BAA[(last)][({lat}):1:({lat})][({lon}):1:({lon})]"
    )
    url = base + query
    
    response = requests.get(url, timeout=30)
    
    if response.status_code != 200:
        return {"error": f"Failed with status {response.status_code}"}

    data = response.json()
    row = data["table"]["rows"][0]

    baa_labels = {
        0: "No Stress",
        1: "Bleaching Watch",
        2: "Bleaching Warning",
        3: "Bleaching Alert Level 1",
        4: "Bleaching Alert Level 2"
    }

    return {
        "timestamp": row[0],
        "latitude": row[1],
        "longitude": row[2],
        "dhw_celsius_weeks": row[3],
        "sst_celsius": row[4],
        "bleaching_alert": row[5],
        "bleaching_status": baa_labels.get(row[5], "Unknown"),
        "source": "NOAA Coral Reef Watch"
    }

if __name__ == "__main__":
    result = get_noaa_dhw()
    print(json.dumps(result, indent=2))
    
     
    