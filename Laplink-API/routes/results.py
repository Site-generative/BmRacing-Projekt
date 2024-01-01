from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
from typing import List
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse

from db.connection import prioritized_get_db_connection
from response_models.response_models import EventResultResponseModel, DriverRankingModelApp, \
    EventResultsGroupedResponseModel, DetailedDriverRankingsResponseModel, EventResultsResponseModel, \
    EventResultsByCategoryResponseModel, TrainingQualificationResultResponseModel
import service.auth as auth

router = APIRouter()

@router.get("/get/event/results", response_model=List[EventResultResponseModel])
async def get_event_results(event_id: int, event_phase_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrcí výsledky celého závodu se všemi kategoriemi, seřazené podle car_category.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)
    try:
        command ="""SELECT 
            reg.car_category_id, 
            cc.name AS category_name, 
            er.id AS result_id, 
            er.event_phase_id, 
            er.event_registration_id, 
            er.total_time, 
            er.points, 
            er.position, 
            reg.dnf, 
            drv.name AS driver_name, 
            drv.surname AS driver_surname, 
            drv.email AS driver_email,
            drv.number, 
            ep.phase_name
        FROM 
            event_result er
        INNER JOIN 
            event_registration reg ON er.event_registration_id = reg.id
        INNER JOIN 
            car_category cc ON reg.car_category_id = cc.id
        INNER JOIN 
            driver drv ON reg.driver_id = drv.id
        INNER JOIN 
            event_phase ep ON er.event_phase_id = ep.id
        WHERE 
            er.event_phase_id = %s 
            AND reg.event_id = %s
        ORDER BY 
            reg.car_category_id, 
            er.position;
"""
        values = (event_phase_id, event_id)
        cursor.execute(command, values)
        result = cursor.fetchall()

        if not result or len(result) == 0:
            raise HTTPException(status_code=404, detail="Event results not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event results: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/event/results/{event_phase_id}", response_model=List[EventResultResponseModel])
async def get_event_results_for_category(event_phase_id: int, event_id: int, car_category_id,api_key: APIKey = Depends(auth.get_api_key)):
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)
    try:
        command = """SELECT 
            er.id AS result_id,
            er.event_phase_id,
            er.event_registration_id,
            reg.car_category_id,
            cc.name AS category_name,
            er.total_time,
            er.points,
            er.position,
            reg.dnf,
            drv.name AS driver_name,
            drv.surname AS driver_surname,
            drv.email AS driver_email,
            drv.number, 
            ep.phase_name
            FROM 
            event_result er
            INNER JOIN 
                event_registration reg ON er.event_registration_id = reg.id
            INNER JOIN 
                car_category cc ON reg.car_category_id = cc.id
            INNER JOIN 
                driver drv ON reg.driver_id = drv.id
            INNER JOIN 
                event_phase ep ON er.event_phase_id = ep.id
            WHERE 
                er.event_phase_id = %s
                AND reg.car_category_id = %s
                AND reg.event_id = %s
            ORDER BY 
                er.position;
    """
        values = (event_phase_id, car_category_id, event_id)
        cursor.execute(command, values)
        result = cursor.fetchall()

        if not result:
            raise HTTPException(status_code=404, detail="Event results not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event results: {e}")
    finally:
        cursor.close()
        db_connection.close()
@router.get(
    "/get/app/event/results",
    response_model=EventResultsGroupedResponseModel
)
async def get_app_event_results(event_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)
    try:
        command = """
            SELECT 
                reg.car_category_id, 
                cc.name AS category_name, 
                er.position, 
                er.total_time, 
                CONCAT(drv.name, ' ', drv.surname) AS full_name, 
                drv.web_user,
                er.event_phase_id,
                ep.phase_name
            FROM 
                event_result er
            INNER JOIN 
                event_registration reg ON er.event_registration_id = reg.id
            INNER JOIN 
                car_category cc ON reg.car_category_id = cc.id
            INNER JOIN 
                driver drv ON reg.driver_id = drv.id
            INNER JOIN
                event_phase ep ON er.event_phase_id = ep.id
            WHERE 
                reg.event_id = %s
            ORDER BY 
                reg.car_category_id ASC, 
                er.event_phase_id ASC,
                er.position ASC;
        """
        values = (event_id,)
        cursor.execute(command, values)
        result = cursor.fetchall()

        if not result:
            return []

        # Seskupení
        grouped_results = {}
        for row in result:
            car_category = row["car_category_id"]
            event_phase = row["event_phase_id"]

            if car_category not in grouped_results:
                grouped_results[car_category] = {
                    "category_name": row["category_name"],
                    "phases": {}
                }

            if event_phase not in grouped_results[car_category]["phases"]:
                grouped_results[car_category]["phases"][event_phase] = {
                    "phase_name": row["phase_name"],
                    "results": []
                }

            grouped_results[car_category]["phases"][event_phase]["results"].append({
                "position": row["position"],
                "total_time": row["total_time"],
                "full_name": row["full_name"],
                "web_user": row["web_user"],
            })

        # Transformace do listů pro Pydantic model
        data = []
        for car_category_id, category_data in sorted(grouped_results.items()):
            phases_list = []
            for event_phase_id, phase_data in category_data["phases"].items():
                phases_list.append({
                    "event_phase_id": event_phase_id,
                    "phase_name": phase_data["phase_name"],
                    "results": phase_data["results"]
                })

            data.append({
                "car_category_id": car_category_id,
                "category_name": category_data["category_name"],
                "phases": phases_list
            })

        return {
            "status": "success",
            "message": "Results fetched successfully",
            "data": data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event results: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/dnf/{event_id}", response_model=List[EventResultResponseModel])
async def get_dnf(event_id: int, event_phase_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)
    try:
        command = """
            SELECT er.id AS result_id, er.event_phase_id, er.event_registration_id, reg.car_category_id, 
            cc.name AS category_name, er.total_time, er.points, er.position, reg.dnf, 
            drv.name AS driver_name, drv.email AS driver_email, drv.number, ep.phase_name, 
            drv.surname AS driver_surname, drv.email AS driver_email FROM event_result er 
            INNER JOIN event_registration reg ON er.event_registration_id = reg.id 
            INNER JOIN car_category cc ON reg.car_category_id = cc.id 
            INNER JOIN driver drv ON reg.driver_id = drv.id 
            INNER JOIN event_phase ep ON er.event_phase_id = ep.id 
            WHERE er.event_phase_id = %s AND reg.event_id = %s AND reg.dnf = 1 
            ORDER BY reg.car_category_id, er.position;
        """
        values = (event_phase_id, event_id)
        cursor.execute(command, values)
        result = cursor.fetchall()

        if not result:
            raise HTTPException(status_code=404, detail="Event results not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event results: {e}")
    finally:
        cursor.close()
        db_connection.close()


@router.get("/get/series/driver-rankings")
async def get_driver_rankings(series_id: int, car_category_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    """
    Vrací seznam řidičů s body v dané sérii, seřazené podle bodů.
    """
    db_connection = prioritized_get_db_connection("low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        query = """
                    SELECT 
                        d.name, 
                        d.surname, 
                        d.email, 
                        d.number AS race_number, 
                        cc.name AS car_category, 
                        SUM(er.points) AS points,
                        d.web_user
                    FROM event_result er
                    JOIN event_registration reg ON er.event_registration_id = reg.id
                    JOIN event e ON reg.event_id = e.id
                    JOIN driver d ON reg.driver_id = d.id
                    JOIN car_category cc ON reg.car_category_id = cc.id
                    WHERE e.series_id = %s AND reg.car_category_id = %s
                    GROUP BY d.id, d.name, d.surname, d.email, d.number, cc.name
                    ORDER BY points DESC;
                """
        cursor.execute(query, (series_id,car_category_id))
        driver_rankings = cursor.fetchall()

        if not driver_rankings:
            raise HTTPException(status_code=404, detail="No driver rankings found for this series")

        return driver_rankings

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching driver rankings: {e}")

    finally:
        cursor.close()
        db_connection.close()


@router.get("/get/series/detailed/driver-rankings")
async def get_detailed_driver_rankings(series_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    """
    Vrací seznam řidičů s body v dané sérii, seskupených podle kategorie vozidel, seřazené podle bodů,
    včetně zobrazení všech závodů série a kolik bodů v každém z nich dostal (součet bodů z kvalifikace a závodu).
    """
    db_connection = prioritized_get_db_connection("low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        # Získání všech bodů podle jezdců, včetně kategorie + její ID
        query = """
            SELECT 
                d.id AS driver_id,
                CONCAT(d.name, ' ', d.surname) AS driver_name,
                d.number AS race_number,
                CONCAT(c.maker, ' ', c.type) AS car,
                cc.id AS category_id,
                cc.name AS category
            FROM event_registration reg
            JOIN event e ON reg.event_id = e.id
            JOIN driver d ON reg.driver_id = d.id
            JOIN car c ON reg.car_id = c.id
            JOIN car_category cc ON reg.car_category_id = cc.id
            WHERE e.series_id = %s 
            GROUP BY d.id, d.name, d.surname, d.number, car, cc.id, cc.name;
        """
        cursor.execute(query, (series_id,))
        drivers = cursor.fetchall()

        if not drivers:
            raise HTTPException(status_code=404, detail="No driver rankings found for this series")

        # Pro každého řidiče získáme detailní body ze závodů
        for driver in drivers:
            driver_id = driver["driver_id"]

            query_race_results = """
                SELECT 
                    e.id AS event_id,
                    e.name AS event_name,
                    COALESCE(SUM(er.points), 0) AS points
                FROM event_result er
                JOIN event_registration reg ON er.event_registration_id = reg.id
                JOIN event e ON reg.event_id = e.id
                WHERE reg.driver_id = %s 
                    AND e.series_id = %s
                    AND er.event_phase_id IN (2,3)
                GROUP BY e.id, e.name
                ORDER BY e.id;
            """
            cursor.execute(query_race_results, (driver_id, series_id))
            race_results = cursor.fetchall()

            # Přidání závodů do odpovědi + převod Decimal na int
            driver["races"] = {race["event_name"]: int(race["points"]) for race in race_results}

            # Přepočítání total_points jako součet všech bodů ze závodů + převod na int
            driver["total_points"] = int(sum(driver["races"].values()))

        # Seskupení podle kategorie vozidel
        grouped_drivers = defaultdict(list)
        category_order = {}

        for driver in drivers:
            category = driver["category"]
            category_id = driver["category_id"]
            grouped_drivers[category].append(driver)
            category_order[category] = category_id  # Uložíme ID kategorie

        # Seřazení jezdců v každé kategorii podle total_points (nejvyšší nahoře)
        for category in grouped_drivers:
            grouped_drivers[category] = sorted(grouped_drivers[category], key=lambda x: x["total_points"], reverse=True)

        # Seřazení skupin podle jejich ID
        sorted_categories = sorted(grouped_drivers.keys(), key=lambda cat: category_order[cat])

        # Výstup jako seznam slovníků, kde každý obsahuje kategorii a její jezdce
        result = [{"category": category, "drivers": grouped_drivers[category]} for category in sorted_categories]

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching detailed driver rankings: {e}")

    finally:
        cursor.close()
        db_connection.close()
@router.get("/get/series/all-rankings", response_model=List[DriverRankingModelApp])
async def get_all_driver_rankings(series_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    """
    Vrací seznam řidičů v dané sérii, seskupený podle kategorií vozidel a seřazený podle bodů.
    """
    db_connection = prioritized_get_db_connection("low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        query = """
            SELECT 
                cc.name AS car_category,
                d.name, 
                d.surname, 
                d.email, 
                d.number AS race_number, 
                cc.name AS car_category, 
                SUM(er.points) AS points,
                d.web_user
            FROM event_result er
            JOIN event_registration reg ON er.event_registration_id = reg.id
            JOIN event e ON reg.event_id = e.id
            JOIN driver d ON reg.driver_id = d.id
            JOIN car_category cc ON reg.car_category_id = cc.id
            WHERE e.series_id = %s
            GROUP BY d.id, d.name, d.surname, d.email, d.number, cc.name
            ORDER BY cc.id, points DESC;
        """
        cursor.execute(query, (series_id,))
        results = cursor.fetchall()

        if not results:
            raise HTTPException(status_code=404, detail="No results found for this series")

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching all driver rankings: {e}")

    finally:
        cursor.close()
        db_connection.close()


@router.get("/get/phase/race/results/{event_id}/{phase_id}", response_model=List[EventResultsByCategoryResponseModel])
async def get_event_results(event_id: int, phase_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací výsledky závodu podle event_id a phase_id, seskupené podle kategorií aut.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        query = """
            SELECT 
                cat.id AS category_id, 
                cat.name AS category_name,
                d.id AS driver_id,
                er.points AS points,  
                d.number AS start_number,
                reg.dnf,
                reg.finished,
                CONCAT(d.name, ' ', d.surname) AS driver_name,
                CONCAT(c.maker, ' ', c.type) AS car,
                SEC_TO_TIME(SUM(TIME_TO_SEC(el.laptime))) AS total_time,
                GROUP_CONCAT(el.laptime ORDER BY el.id SEPARATOR ', ') AS lap_times
            FROM 
                event_result er
            JOIN event_registration reg ON er.event_registration_id = reg.id
            JOIN driver d ON reg.driver_id = d.id
            JOIN car c ON reg.car_id = c.id
            JOIN car_category cat ON reg.car_category_id = cat.id
            JOIN event_lap el ON er.event_registration_id = el.event_registration_id
            WHERE 
                reg.event_id = %s
                AND er.event_phase_id = %s
            GROUP BY 
                cat.id, cat.name, d.id, d.number, d.name, d.surname, c.maker, c.type, er.points
            ORDER BY 
                cat.id ASC, total_time ASC;
        """

        cursor.execute(query, (event_id, phase_id))
        event_results = cursor.fetchall()

        # Skupinování výsledků podle kategorie
        categories = defaultdict(list)

        for index, result in enumerate(event_results, start=1):
            result["position"] = len(categories[result["category_id"]]) + 1  # Pozice v rámci kategorie
            if isinstance(result["total_time"], timedelta):
                result["total_time"] = str(result["total_time"])
            result["lap_times"] = result["lap_times"].split(", ")

            categories[result["category_id"]].append(result)

        # Převod do finálního formátu
        grouped_results = [
            {"category_id": cat_id, "category_name": results[0]["category_name"], "results": results}
            for cat_id, results in categories.items()
        ]

        return grouped_results
    except Exception as e:
        print(f"SQL Error: {e}")  # Ladicí výpis
        raise HTTPException(status_code=500, detail=f"Error fetching event results: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/training/qualification/results", response_model=List[TrainingQualificationResultResponseModel])
async def get_event_results(event_id: int, event_phase_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací výsledky celého závodu se všemi kategoriemi, seřazené podle car_category.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)
    try:
        command = """SELECT 
            er.position, 
            er.points, 
            drv.number, 
            drv.name AS name, 
            drv.surname AS surname, 
            concat(c.maker, ' ', c.type) AS car, 
            cc.name AS car_class, 
            min(el.laptime) AS best_lap
        FROM 
            event_result er
        INNER JOIN event_registration reg ON er.event_registration_id = reg.id
        INNER JOIN driver drv ON reg.driver_id = drv.id
        INNER JOIN car c ON reg.car_id = c.id
        INNER JOIN car_category cc ON reg.car_category_id = cc.id
        INNER JOIN event_lap el ON er.event_registration_id = el.event_registration_id
        WHERE 
            er.event_phase_id = %s 
            AND reg.event_id = %s
        GROUP BY 
            er.position, 
            er.points, 
            drv.number, 
            drv.name, 
            drv.surname, 
            c.maker, 
            c.type, 
            cc.name
        ORDER BY 
            reg.car_category_id, 
            er.position;
        """
        values = (event_phase_id, event_id)
        cursor.execute(command, values)
        result = cursor.fetchall()

        if not result or len(result) == 0:
            raise HTTPException(status_code=404, detail="Event results not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event results: {e}")
    finally:
        cursor.close()
        db_connection.close()
