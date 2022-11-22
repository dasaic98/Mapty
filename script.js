'use strict';


class Wokout{

    date=new Date();
    id=(Date.now()+'').slice(-10);

    constructor(coords,distance,duration){
        this.coords=coords;
        this.distance=distance; //km
        this.duration=duration; //min
    };

    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description=`${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
};

class Running extends Wokout{
    
    type='running';
    constructor(coords,distance,duration,cadence,pace){
    super(coords,distance,duration);
    this.cadence=cadence;
    this._setDescription();
    this.calcPace();
    };

    calcPace(){
        this.pace=this.duration/this.distance;
        return this.pace;
    };
};

class Cycling extends Wokout{
    
    type='cycling';
    constructor(coords,distance,duration,elevation,speed){
    super(coords,distance,duration);
    this.elevation=elevation;
    this._setDescription();
    this.calcSpeed();
    };

    calcSpeed(){
        this.pace=this.distance/this.duration/60;
        return this.speed;
    };
};

const form = document.querySelector('.form');
const mapElement = document.querySelector('map');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class App{
    #map;
    #mapZoom
    #mapEvent;
    #workouts=[];

    constructor(){
        this._getPosition();
        this.#mapZoom=13;

        form.addEventListener('submit',this._newWorkout.bind(this));
        inputType.addEventListener('change',this._toggleElevation);

        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
    }

    _getPosition(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
                function(){
                    alert("Could not get you position");
                });
        };
    };

    _loadMap(position){
        const {longitude}=position.coords;
        const {latitude}=position.coords;
        console.log(`https://google.pt/maps/@${latitude},${longitude}/`);

        const coords=[latitude,longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoom); //'map' in innerhtml

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        
        this.#map.on('click',this._showForm.bind(this));

        this.#workouts.forEach(work=>{
            this._renderWorkoutMarker(work); 
        });
    };

    _toggleElevation(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    };

    _newWorkout(e){
        e.preventDefault();

        const validInputs=(...inputs)=>inputs.every(inp=>Number.isFinite(inp)&&inp>0);
        
        const type=inputType.value;
        const distance= +inputDistance.value;
        const duration= +inputDuration.value;

        const {lat,lng}=this.#mapEvent.latlng;

        if(type==='running'){
            const cadence= +inputCadence.value;
            // if(!Number.isFinite(distance) ||
            //     !Number.isFinite(cadence) ||
            //     !Number.isFinite(duration)
            // ) 
            if(!validInputs(distance,duration,cadence))
                return alert('Inputs should be positive numbers');

            const workout=new Running([lat,lng],distance,duration,cadence);
            this.#workouts.push(workout);
            this._renderWorkoutMarker(workout);
            this._renderWorkout(workout);
        };

        if(type==='cycling'){
            const elevation= +inputElevation.value;
            // if(!Number.isFinite(distance) ||
            //     !Number.isFinite(elevation) ||
            //     !Number.isFinite(duration)
            // ) 
            if(!validInputs(distance,duration,elevation))
                return alert('Inputs should be positive numbers');
            
            const workout=new Cycling([lat,lng],distance,duration,elevation);
            this.#workouts.push(workout);
            this._renderWorkoutMarker(workout);
            this._renderWorkout(workout);
        };

        this._hideForm();
        this._setLocalStorage();
    };

    _hideForm(){
        inputDistance.value=inputDuration.value=inputCadence.value=inputElevation.value='';
        form.getElementsByClassName.display='none';
        form.classList.add('hidden');
        setTimeout(()=>form.getElementsByClassName.display='grid',1000);
    };

    _showForm(mapE){
        this.#mapEvent=mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    };

    _renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map).bindPopup(
            L.popup({
                maxWidth:250,
                minWidth:100,
                autoClose:false,
                closeOnClick:false,
                className:`${workout.type}-popup`,
            })).setPopupContent(`${workout.type==='running'?'🏃‍♂️':'🚴‍♀️'} ${workout.description}`)
            .openPopup();
    };

    _renderWorkout(workout){
        let html=`<li class="workout workout--running" data-id="${workout.id}">
        <h2 class="workout__title">Running on ${workout.description.slice(10)}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type==='running'?'🏃‍♂️':'🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

        if(workout.type==='running'){
            html+=`<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>`;
        };
        if(workout.type==='cycling'){
            html+=`<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>`;
        };

        form.insertAdjacentHTML('afterend',html);
    };

    _moveToPopup(e){
        const workoutEl=e.target.closest('.workout');

        if(!workoutEl) return;

        const workout=this.#workouts.find(
            work=>work.id===workoutEl.dataset.id);

        this.#map.setView(workout.coords,this.#mapZoom,{
            animate:true,
            pan:{
                duration: 1,
            },
        });
    };

    _setLocalStorage(){
        localStorage.setItem('workouts',JSON.stringify(this.#workouts));
    };

    _getLocalStorage(){
        const data=localStorage.getItem('workouts');

        if(!data) return;
        this.#workouts=data;

        this.#workouts.forEach(work=>{
            this._renderWorkout(work);
            // this._renderWorkoutMarker(work); //cant add marker as map isnt loaded at start of the app
        });
    };

    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }

};

const app=new App();

