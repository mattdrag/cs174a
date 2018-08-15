// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett for CS174a.
// example-scene-components.js - The Scene_Component subclasses defined here describe different independent animation processes that you 
// want to fire off each frame, by defining a display event and how to react to key and mouse input events.  Create your own subclasses, 
// and fill them in with all your shape drawing calls and any extra key / mouse controls.

  // *******************************************************************
  //  Assignment 2 


Declare_Any_Class( "Bee_Scene",  // An example of drawing a hierarchical object using a "model_transform" matrix and post-multiplication.
  { 'construct'( context )
      { var shapes = { "box" : new        Cube(), 
                       'hat' : new Hat(),                  
                       'hat_head' : new Hat_Head(),   
                       'square'       : new Square(), 
                       "body" : new        Closed_Cone(10, 10), 
                       "ball": new Grid_Sphere( 10, 10 ) };
        this.submit_shapes( context, shapes );
        
        // var audio = new Audio('raw.mp3');
        // audio.volume = 0.05;
        // audio.play();

        //define player coords
        this.define_data_members( { 
                                    GAME_START:     1,

                                    UPPER_BOUND:     120,
                                    LOWER_BOUND:    -120,
                                    player_x:       120,
                                    player_z:       120,
                                    player_objectives: 0, // win at 3
                                    player_facing:  2,  //1 = Up
                                                        //2 = Down
                                                        //3 = Left
                                                        //4 = Right

                                    animation_state: 0, //0 = idle
                                                        //1 = hop
                                                        //2 = game win
                                    hop_buffer:     20, //starts at 20, decrements until 0, then resets

                                    camera_state:    0, //0 = overhead
                                                        //1 = player_cam

                                    stage_x: [0, 20],
                                    stage_z: [0, 20],

                                    object_map: []      //1 = wall
                                                        //2 = thing

                                     } );

        //colors
        this.define_data_members( { 
                                    wizzy: context.shaders_in_use["Phong_Model"  ].material( Color( .5,.5,.5,1 ), .5, .5, .5, 40, context.textures_in_use["wizzy.png"] ),
                                    cbbl: context.shaders_in_use["Phong_Model"  ].material( Color( .5,.5,.5,1 ), .5, .5, .5, 40, context.textures_in_use["cbbl.png"] ),
                                    cbbl2: context.shaders_in_use["Phong_Model"  ].material( Color( .5,.5,.5,1 ), .5, .5, .5, 40, context.textures_in_use["cbbl2.png"] ),
                                    wll: context.shaders_in_use["Phong_Model"  ].material( Color( .5,.5,.5,1 ), .5, .5, .5, 40, context.textures_in_use["wll.png"] ),
                                    greenGround: context.shaders_in_use["Phong_Model" ].material( Color( .2,.8,.3, 1 ), .4, .4, .8, 40 ),
                                    purplePlastic: context.shaders_in_use["Phong_Model" ].material( Color( .95,.5,.95, 1 ), .6, .4, .8, 40 ),
                                    red_clay: context.shaders_in_use["Phong_Model"].material( Color(  1,  .4, .3, 1 ), .2, 1, .7, 40 ),
                                    blueGlass    : context.shaders_in_use["Phong_Model" ].material( Color( .5,.5, 1,.7 ), .4, .8, .4, 40 ),
                                    redGlass    : context.shaders_in_use["Phong_Model" ].material( Color( 1,.5, .5,.7 ), .4, .8, .4, 40 ),
                                    yellowGlass    : context.shaders_in_use["Phong_Model" ].material( Color( .77,  .77, .34,.7 ), .4, .8, .4, 40 ),
                                    greenGlass    : context.shaders_in_use["Phong_Model" ].material( Color( .5,1, .5,.7 ), .4, .8, .4, 40 ),
                                    yellow_clay: context.shaders_in_use["Phong_Model"].material( Color(  .77,  .77, .34, 1 ), .8, 1, .7, 40 ),
                                    brown_clay: context.shaders_in_use["Phong_Model"].material( Color( .7,.3,.2, 1 ), .2, 1,  .7, 20 ),
                                    greyPlastic  : context.shaders_in_use["Phong_Model" ].material( Color( .71,.73,.72, 1 ), .2, .55, .44, 20 )
                                     } );
      },
    'init_keys'( controls )   // init_keys():  Define any extra keyboard shortcuts here
      { 
        controls.add( "h",     this, function() { this.camera_state = 2; } );
        controls.add( "g",     this, function() { this.camera_state = 1; } );                                                                     
        controls.add( "f",     this, function() { this.camera_state = 0; } );
        controls.add( "a",     this, function() { this.attempt_move(3); } );
        controls.add( "w",     this, function() { this.attempt_move(1); } );
        controls.add( "d",     this, function() { this.attempt_move(4); } );
        controls.add( "s",     this, function() { this.attempt_move(2); } );
      },
    'create_map'()
      {
        //bottom left troll: state = 1 to start, index = [0]
        this.add_object(100, -120, 1);

        //bottom middle troll1: state = 2 to start, index = [1]
        this.add_object(-20, -120, 1);  

        //bottom middle troll2: state = 2 to start, index = [2]
        this.add_object(-60, -80, 2);  

        //left troll1: state = 1 to start, index = [3]
        this.add_object(-80, 60, 1);   

        //left troll2: state = 2 to start, index = [4]
        this.add_object(-120, 100, 2);  

        //objective 1, index = [5]
        this.add_object(120, -120, 100);  

        //objective 2, index = [6]
        this.add_object(-120, 120, 100); 

        //objective 3, index = [7]
        this.add_object(20, -120, 100);  

        //goal tile, index = [8]
        this.add_object(80, 120, 200); 

        //beginning hallway
        this.add_object(100, 120, 0);   
        this.add_object(100, 100, 0);
        this.add_object(100, 80, 0);
        this.add_object(100, 60, 0);  
        this.add_object(100, 40, 0);  
        this.add_object(100, 20, 0);

        //lower left segment top
        this.add_object(120, -20, 0);
        this.add_object(100, -20, 0);
        this.add_object(80, -20, 0);
        this.add_object(120, -40, 0);
        this.add_object(100, -40, 0);
        this.add_object(80, -40, 0);

        //lower left room
        this.add_object(100, -80, 0);  
        this.add_object(100, -100, 0); 
        this.add_object(80, -80, 0);  
        this.add_object(80, -100, 0); 

        //lower left room, right wall
        this.add_object(40, -60, 0);
        this.add_object(40, -80, 0);
        this.add_object(40, -100, 0);
        this.add_object(40, -120, 0);

        //bottom room top wall
        this.add_object(20, -60, 0);
        this.add_object(0, -60, 0);
        this.add_object(-20, -60, 0);
        this.add_object(-40, -60, 0);
        this.add_object(-60, -60, 0);
        this.add_object(-80, -60, 0);

        // middle segment top
        this.add_object(80, 20, 0);
        this.add_object(60, 20, 0);
        this.add_object(40, 20, 0);
        this.add_object(20, 20, 0);
        this.add_object(0, 20, 0);
        this.add_object(-20, 20, 0);
   
        //right room
        this.add_object(-60, 20, 0);
        this.add_object(-60, 40, 0);
        this.add_object(-60, 60, 0);
        this.add_object(-60, 80, 0);
        this.add_object(-60, 100, 0);
        this.add_object(-60, 120, 0);

      },
    'add_object'( xv, zv, state )
      {
        this.object_map.push({x: xv, z: zv, s: state});
      },
    'attempt_move'( dir )
      {             
        var nx;
        var nz;   

        //right away, check that were not already moving. if player made move, we dont want to be able to move.
        if(this.animation_state != 0){
          return false;
        }
        //first, check dir and see if somethings in the way  
        if (dir == 1){ //up 
          if ( !this.isCollide(this.player_x, this.player_z, this.player_x, this.player_z + 20) ) { //check collision
            if(this.player_z < this.UPPER_BOUND){
              this.player_facing = 1;
              this.animation_state = 1;
            }
          }
        } 


        else if (dir == 2){ //down
          if ( !this.isCollide(this.player_x, this.player_z, this.player_x, this.player_z - 20) ) { //check collision
            if(this.player_z > this.LOWER_BOUND){
              this.player_facing = 2;
              this.animation_state = 1;
            }
          }
        } 


        else if (dir == 3){ //left
          if ( !this.isCollide(this.player_x, this.player_z, this.player_x + 20, this.player_z) ) { //check collision
            if(this.player_x < this.UPPER_BOUND){
              this.player_facing = 3;
              this.animation_state = 1;
            }
          }
        }


        else if (dir == 4){ //right
          if ( !this.isCollide(this.player_x, this.player_z, this.player_x - 20, this.player_z) ) { //check collision
            if(this.player_x > this.LOWER_BOUND){
              this.player_facing = 4;
              this.animation_state = 1;
            }
          }
        }
      },
    'isCollide'( x, z, nx, nz )
      {
        // loop through object map
        for (var i = 0; i < this.object_map.length; i++) {
            var ox = this.object_map[i].x;
            var oz = this.object_map[i].z;
            var os = this.object_map[i].s;

            if (ox == nx && oz == nz){
              if (os != 100 && os != 101 && os != 200){
                return true;
              }
            }
        } 

        return false;
      },
    'draw_ground'( model_transform, graphics_state, x_coord, z_coord, t_color )
      { 
        var origin = model_transform;

        model_transform = mult( model_transform, translation( x_coord, -10, z_coord ) );
        model_transform = mult( model_transform, scale( 10, 1, 10 ) );
        
        //alternate floor tile
        if (t_color)
          this.shapes.box       .draw( graphics_state, model_transform,                      this.cbbl );
        else
          this.shapes.box       .draw( graphics_state, model_transform,                      this.cbbl2 );
        return origin;     
      },
    'draw_wall'( model_transform, graphics_state, x_coord, z_coord)
      { 
        var origin = model_transform;

        model_transform = mult( model_transform, translation( x_coord, -10, z_coord ) );
        model_transform = mult( model_transform, scale( 10, 10, 10 ) );
        
        this.shapes.box       .draw( graphics_state, model_transform,                      this.wll );

        return origin;     
      },
    'update_trolls'( model_transform, graphics_state)
      { 
        var origin = model_transform;

        //troll 0
        if (this.object_map[0].s == 1){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[0].x-=2, this.object_map[0].z );
          if (this.object_map[0].x == 60){
            this.object_map[0].s = 2;
          }
        }
        else if (this.object_map[0].s == 2){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[0].x, this.object_map[0].z+=2 );
          if (this.object_map[0].z == -60){
            this.object_map[0].s = 3;
          }
        }
        else if (this.object_map[0].s == 3){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[0].x+=2, this.object_map[0].z );
          if (this.object_map[0].x == 120){
            this.object_map[0].s = 4;
          }
        }
        else if (this.object_map[0].s == 4){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[0].x, this.object_map[0].z-=2 );
          if (this.object_map[0].z == -120){
            this.object_map[0].s = 1;
          }
        }

        //troll 1
        if (this.object_map[1].s == 1){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[1].x, this.object_map[1].z+=2 );
          if (this.object_map[1].z == -80){
            this.object_map[1].s = 2;
          }
        }
        else if (this.object_map[1].s == 2){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[1].x, this.object_map[1].z-=2 );
          if (this.object_map[1].z == -120){
            this.object_map[1].s = 1;
          }
        }

        //troll 2
        if (this.object_map[2].s == 1){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[2].x, this.object_map[2].z+=2 );
          if (this.object_map[2].z == -80){
            this.object_map[2].s = 2;
          }
        }
        else if (this.object_map[2].s == 2){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[2].x, this.object_map[2].z-=2 );
          if (this.object_map[2].z == -120){
            this.object_map[2].s = 1;
          }
        }

        //troll 3
        if (this.object_map[3].s == 1){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[3].x-=2, this.object_map[3].z );
          if (this.object_map[3].x == -120){
            this.object_map[3].s = 2;
          }
        }
        else if (this.object_map[3].s == 2){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[3].x+=2, this.object_map[3].z );
          if (this.object_map[3].x == -80){
            this.object_map[3].s = 1;
          }
        }

        //troll 4
        if (this.object_map[4].s == 1){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[4].x-=2, this.object_map[4].z );
          if (this.object_map[4].x == -120){
            this.object_map[4].s = 2;
          }
        }
        else if (this.object_map[4].s == 2){
          model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[4].x+=2, this.object_map[4].z );
          if (this.object_map[4].x == -80){
            this.object_map[4].s = 1;
          }
        }

        return origin;     
      },
    'draw_troll'( model_transform, graphics_state, x_coord, z_coord)
      { 
        var origin = model_transform;

        model_transform = mult( model_transform, translation( x_coord, -5, z_coord ) );
        //draw body
        model_transform = mult( model_transform, rotation( -90, 1, 0, 0 ) );
        model_transform = mult( model_transform, scale( 4, 4, 4 ) );
        this.shapes.body       .draw( graphics_state, model_transform,                      this.greenGround );
        model_transform = mult( model_transform, scale( .25, .25, .25 ) );
        model_transform = mult( model_transform, rotation( 90, 1, 0, 0 ) );

        return origin;     
      },
    'draw_player'( model_transform, graphics_state, x, z )
      { 
        var origin = model_transform;

        //translate to origin x z
        model_transform = mult( model_transform, translation( x, -5, z ) );

        //draw orbs
        model_transform = mult( model_transform, rotation(graphics_state.animation_time * .07, 0, -1, 0) );

        //fire
        model_transform = mult( model_transform, translation( 5, 0, 0 ) );
        this.shapes.ball       .draw( graphics_state, model_transform,                      this.redGlass );
        model_transform = mult( model_transform, translation( -5, 0, 0 ) );
        //water
        model_transform = mult( model_transform, translation( -5, 0, 0 ) );
        this.shapes.ball       .draw( graphics_state, model_transform,                      this.blueGlass );
        model_transform = mult( model_transform, translation( 5, 0, 0 ) );
        //earth
        model_transform = mult( model_transform, translation( 0, 0, 5 ) );
        this.shapes.ball       .draw( graphics_state, model_transform,                      this.greenGlass );
        model_transform = mult( model_transform, translation( 0, 0, -5 ) );
        //lightning
        model_transform = mult( model_transform, translation( 0, 0, -5 ) );
        this.shapes.ball       .draw( graphics_state, model_transform,                      this.yellowGlass );
        model_transform = mult( model_transform, translation( 0, 0, 5 ) );


        model_transform = mult( model_transform, rotation(-(graphics_state.animation_time * .07), 0, -1, 0) );

        //rotate depending on player_facing             //1 = Up
                                                        //2 = Down
                                                        //3 = Left
                                                        //4 = Right

          //we start facing down / up

        if (this.player_facing == 3){
          model_transform = mult( model_transform, rotation( 90, 0, 1, 0 ) );
        }
        else if (this.player_facing == 4){
          model_transform = mult( model_transform, rotation( -90, 0, 1, 0 ) );
        }

        //draw body
        model_transform = mult( model_transform, rotation( -90, 1, 0, 0 ) );
        model_transform = mult( model_transform, scale( 4, 4, 4 ) );
        this.shapes.body       .draw( graphics_state, model_transform,                      this.wizzy );
        model_transform = mult( model_transform, scale( .25, .25, .25 ) );
        model_transform = mult( model_transform, rotation( 90, 1, 0, 0 ) );

        //draw arms
        //right
        model_transform = this.draw_arm(model_transform, graphics_state);

        //left
        model_transform = mult( model_transform, rotation( 180, 0, 1, 0 ) );
        model_transform = this.draw_arm(model_transform, graphics_state);
        model_transform = mult( model_transform, rotation( -180, 0, 1, 0 ) );

        //draw head
        model_transform = mult( model_transform, translation( 0, 6, 0 ) );
        model_transform = mult( model_transform, scale( 2, 2, 2 ) );
        this.shapes.hat_head       .draw( graphics_state, model_transform,                      this.wizzy );
        model_transform = mult( model_transform, scale( .5, .5, .5 ) );
        model_transform = mult( model_transform, translation( 0, -6, 0 ) );

        return origin;   
      },
    'draw_arm'(model_transform, graphics_state)
    {
      var origin = model_transform;

      //draw shoulder
      model_transform = mult( model_transform, translation( .5, 2, 0 ) );
      this.shapes.ball       .draw( graphics_state, model_transform,                      this.wizzy );
      model_transform = mult( model_transform, translation( -.5, -2, 0 ) );

      //upper segment
      model_transform = mult( model_transform, translation( 2, 1.5, 0 ) );
      model_transform = mult( model_transform, rotation( -33, 0, 0, 1 ) );
      model_transform = mult( model_transform, scale( 1, .25, .25 ) );
      this.shapes.box       .draw( graphics_state, model_transform,                      this.yellow_clay );
      model_transform = mult( model_transform, scale( 1, 4, 4 ) );
      model_transform = mult( model_transform, rotation( 33, 0, 0, 1 ) );
      model_transform = mult( model_transform, translation( -2, -1.5, 0 ) );

      //lower segment
      model_transform = mult( model_transform, translation( 2.75, 0, 0 ) );
      model_transform = mult( model_transform, scale( .25, 1, .25 ) );
      this.shapes.box       .draw( graphics_state, model_transform,                      this.yellow_clay );

      return origin; 
    },
    'display'( graphics_state ) 
        { 
        var model_transform = identity();             // We have to reset model_transform every frame.

        var count;
        var dx = 120;
        var dz = 140;
        var ox;
        var oz;
        var os;
        var i;

        if (this.GAME_START){
          this.create_map();
          this.GAME_START = 0;
        }

        //draw tiles
        for(count = 0; count < 169; count++) {
          // move down one row
          if (count % 13 == 0){
            dx = 120;
            dz-=20;
          }

          if (count % 2){
            model_transform = this.draw_ground( model_transform, graphics_state, dx, dz, 1 );
          }
          else{
            model_transform = this.draw_ground( model_transform, graphics_state, dx, dz, 0 ); 
          }
          dx-=20;
        }


        //draw walls
        for (i = 0; i < this.object_map.length; i++) {
            ox = this.object_map[i].x;
            oz = this.object_map[i].z;
            os = this.object_map[i].s;
            if (os == 0){
              model_transform = this.draw_wall( model_transform, graphics_state, ox, oz );
            }
        } 

        // draw player and trolls
        if(this.animation_state == 0){  //we are idle
          //player
           model_transform = this.draw_player( model_transform, graphics_state, this.player_x, this.player_z );

          //troll 0
           model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[0].x, this.object_map[0].z );
           //troll 1
           model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[1].x, this.object_map[1].z );
           //troll 2
           model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[2].x, this.object_map[2].z );
           //troll 3
           model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[3].x, this.object_map[3].z );
           //troll 4
           model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[4].x, this.object_map[4].z );
        }
        else if(this.animation_state == 1){ //we want to hop

          //check our hop buffer
          if (this.hop_buffer == 0){ 
            //were done, reset animation state and hop buffer
            this.hop_buffer = 20;
            this.animation_state = 0;
            model_transform = this.draw_player( model_transform, graphics_state, this.player_x, this.player_z );

            //troll 0
            model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[0].x, this.object_map[0].z );
            //troll 1
            model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[1].x, this.object_map[1].z );
            //troll 1
            model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[2].x, this.object_map[2].z );
            //troll 3
           model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[3].x, this.object_map[3].z );
           //troll 4
           model_transform = this.draw_troll( model_transform, graphics_state, this.object_map[4].x, this.object_map[4].z );
          }
          else{
            //hop the player in the direction they are facing
            if (this.player_facing == 1){ //up
              this.player_z+=2;
            }
            else if (this.player_facing == 2){ //down
              this.player_z-=2;
            }
            else if (this.player_facing == 3){ //left
              this.player_x+=2;
            }
            else if (this.player_facing == 4){ //right
              this.player_x-=2;
            }

            this.hop_buffer-=2;
            model_transform = this.draw_player( model_transform, graphics_state, this.player_x, this.player_z );
            model_transform = this.update_trolls( model_transform, graphics_state );
          }
        }
        else if(this.animation_state == 2){
            //player
           model_transform = this.draw_player( model_transform, graphics_state, this.player_x, this.player_z );
        }

        //draw keys
        if (this.object_map[5].s == 100){
          model_transform = mult( model_transform, translation( this.object_map[5].x, -5, this.object_map[5].z ) );
          this.shapes.ball       .draw( graphics_state, model_transform,                      this.red_clay );
          model_transform = mult( model_transform, translation( -this.object_map[5].x, 5, -this.object_map[5].z ) );
        }
        if (this.object_map[6].s == 100){
          model_transform = mult( model_transform, translation( this.object_map[6].x, -5, this.object_map[6].z ) );
          this.shapes.ball       .draw( graphics_state, model_transform,                      this.red_clay );
          model_transform = mult( model_transform, translation( -this.object_map[6].x, 5, -this.object_map[6].z ) );
        }
        if (this.object_map[7].s == 100){
          model_transform = mult( model_transform, translation( this.object_map[7].x, -5, this.object_map[7].z ) );
          this.shapes.ball       .draw( graphics_state, model_transform,                      this.red_clay );
          model_transform = mult( model_transform, translation( -this.object_map[7].x, 5, -this.object_map[7].z ) );
        }

        //draw goal tile
        model_transform = mult( model_transform, translation( this.object_map[8].x, -9, this.object_map[8].z ) );
        model_transform = mult( model_transform, scale( 10, 1, 10 ) );
        if (this.player_objectives == 3){
          this.shapes.box       .draw( graphics_state, model_transform,                      this.yellow_clay );
        }
        else{
          this.shapes.box       .draw( graphics_state, model_transform,                      this.brown_clay );
        }
        model_transform = mult( model_transform, scale( .1, 1, .1 ) );
        model_transform = mult( model_transform, translation( -this.object_map[8].x, 9, -this.object_map[8].z ) );

        //see if we picked up an object
        if (this.player_x == this.object_map[5].x && this.player_z == this.object_map[5].z && this.object_map[5].s == 100 ){
          alert("You've collected a key!!!");
          this.object_map[5].s = 101;
          this.player_objectives++;
        }
        if (this.player_x == this.object_map[6].x && this.player_z == this.object_map[6].z && this.object_map[6].s == 100 ){
          alert("You've collected a key!!!");
          this.object_map[6].s = 101;
          this.player_objectives++;
        }
        if (this.player_x == this.object_map[7].x && this.player_z == this.object_map[7].z && this.object_map[7].s == 100 ){
          alert("You've collected a key!!!");
          this.object_map[7].s = 101;
          this.player_objectives++;
        }

        //see if we won the game
        if (this.player_x == this.object_map[8].x && this.player_z == this.object_map[8].z){
          if (this.player_objectives == 3 && this.animation_state != 2){
            alert("Congratulations! You've won!");
            this.animation_state == 2;
          }
        }

        //light follows player
        graphics_state.lights = [ new Light( vec4(  this.player_x,  30,  this.player_z, 1 ), Color( .5, .5, .5, 1 ), 10) ];   // Arguments to construct a Light(): Light source position or 
                                                                                                              // vector (homogeneous coordinates), color, and size.

        //camera    
        if(this.camera_state == 0){
          graphics_state.camera_transform = lookAt( [this.player_x,350,-25], [this.player_x,0,0], [0,1,0] );
        }                                                                                              
        else if (this.camera_state == 1){
          graphics_state.camera_transform = lookAt( [this.player_x,35,this.player_z-15], [this.player_x,0,this.player_z], [0,1,0] ); // Pass in eye position, at                                                                      
                                                                                      // position, and up vector.
        }   
        else if (this.camera_state == 2){
          graphics_state.camera_transform = lookAt( [this.player_x,0,this.player_z-35], [this.player_x,0,this.player_z], [0,1,0] ); // Pass in eye position, at                                                                      
                                                                                      // position, and up vector.
        }                                                                                                 

      }
  }, Scene_Component );
  
  // ******************************************************************
  // The rest of this file is more code that powers the included demos.

Declare_Any_Class( "Debug_Screen",  // Debug_Screen - An example of a Scene_Component that our Canvas_Manager can manage.  Displays a text user interface.
  { 'construct'( context )
      { this.define_data_members( { string_map:    context.globals.string_map, start_index: 0, tick: 0, visible: false, graphics_state: new Graphics_State(),
                                    text_material: context.shaders_in_use["Phong_Model"].material( 
                                                                                Color(  0, 0, 0, 1 ), 1, 0, 0, 40, context.textures_in_use["text.png"] ) } );
        var shapes = { 'debug_text': new Text_Line( 35 ),
                       'cube':   new Cube() };
        this.submit_shapes( context, shapes );
      },
    'init_keys'( controls )
      { controls.add( "t",    this, function() { this.visible ^= 1;                                                                                                  } );
        controls.add( "up",   this, function() { this.start_index = ( this.start_index + 1 ) % Object.keys( this.string_map ).length;                                } );
        controls.add( "down", this, function() 
                                    { this.start_index = ( this.start_index - 1   + Object.keys( this.string_map ).length ) % Object.keys( this.string_map ).length; } );
        this.controls = controls;
      },
    'update_strings'( debug_screen_object )   // Strings that this Scene_Component contributes to the UI:
      { 
        // debug_screen_object.string_map["tick"]              = "Frame: " + this.tick++;
        // debug_screen_object.string_map["text_scroll_index"] = "Text scroll index: " + this.start_index;
      },
    'display'( global_graphics_state )    // Leave these 3D global matrices unused, because this class is instead making a 2D user interface.
      { 
        if( !this.visible ) return;
        var font_scale = scale( .02, .04, 1 ),
            model_transform = mult( translation( -.95, -.9, 0 ), font_scale ),
            strings = Object.keys( this.string_map );
        
        for( var i = 0, idx = this.start_index; i < 4 && i < strings.length; i++, idx = (idx + 1) % strings.length )
        { this.shapes.debug_text.set_string( this.string_map[ strings[idx] ] );
          this.shapes.debug_text.draw( this.graphics_state, model_transform, this.text_material );  // Draw some UI text (each live-updated 
          model_transform = mult( translation( 0, .08, 0 ), model_transform );                      // logged value in each Scene_Component)
        }
        model_transform   = mult( translation( .7, .9, 0 ), font_scale );
        // this.  shapes.debug_text.set_string( "Controls:" );
        // this.  shapes.debug_text.draw( this.graphics_state, model_transform, this.text_material );  // Draw some UI text

        // for( let k of Object.keys( this.controls.all_shortcuts ) )
        // { model_transform = mult( translation( 0, -0.08, 0 ), model_transform );
        //   this.shapes.debug_text.set_string( k );
        //   this.shapes.debug_text.draw( this.graphics_state, model_transform, this.text_material );  // Draw some UI text (the canvas's key controls)
        // }
      }
  }, Scene_Component );

Declare_Any_Class( "Example_Camera",                  // An example of a Scene_Component that our Canvas_Manager can manage.  Adds both first-person and
  { 'construct'( context, canvas = context.canvas )   // third-person style camera matrix controls to the canvas.
      { // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        context.globals.graphics_state.set( translation(0, 0,-25), perspective(45, context.width/context.height, .1, 1000), 0 );
        this.define_data_members( { graphics_state: context.globals.graphics_state, thrust: vec3(), origin: vec3( 0, 5, 0 ), looking: false } );

        // *** Mouse controls: ***
        this.mouse = { "from_center": vec2() };                           // Measure mouse steering, for rotating the flyaround camera:
        var mouse_position = function( e ) { return vec2( e.clientX - context.width/2, e.clientY - context.height/2 ); };   
        canvas.addEventListener( "mouseup",   ( function(self) { return function(e) 
                                                                      { e = e || window.event;    self.mouse.anchor = undefined;              } } ) (this), false );
        canvas.addEventListener( "mousedown", ( function(self) { return function(e) 
                                                                      { e = e || window.event;    self.mouse.anchor = mouse_position(e);      } } ) (this), false );
        canvas.addEventListener( "mousemove", ( function(self) { return function(e) 
                                                                      { e = e || window.event;    self.mouse.from_center = mouse_position(e); } } ) (this), false );
        canvas.addEventListener( "mouseout",  ( function(self) { return function(e) { self.mouse.from_center = vec2(); }; } ) (this), false );  // Stop steering if the 
      },                                                                                                                                        // mouse leaves the canvas.
    'init_keys'( controls )   // init_keys():  Define any extra keyboard shortcuts here
      { controls.add( "Space", this, function() { this.thrust[1] = -1; } );     controls.add( "Space", this, function() { this.thrust[1] =  0; }, {'type':'keyup'} );
        controls.add( "z",     this, function() { this.thrust[1] =  1; } );     controls.add( "z",     this, function() { this.thrust[1] =  0; }, {'type':'keyup'} );
        //controls.add( "w",     this, function() { this.thrust[2] =  1; } );     controls.add( "w",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'} );
        //controls.add( "a",     this, function() { this.thrust[0] =  1; } );     controls.add( "a",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'} );
        //controls.add( "s",     this, function() { this.thrust[2] = -1; } );     controls.add( "s",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'} );
        //controls.add( "d",     this, function() { this.thrust[0] = -1; } );     controls.add( "d",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'} );
        controls.add( ",",     this, function() { this.graphics_state.camera_transform = mult( rotation( 6, 0, 0,  1 ), this.graphics_state.camera_transform ); } );
        controls.add( ".",     this, function() { this.graphics_state.camera_transform = mult( rotation( 6, 0, 0, -1 ), this.graphics_state.camera_transform ); } );
        controls.add( "o",     this, function() { this.origin = mult_vec( inverse( this.graphics_state.camera_transform ), vec4(0,0,0,1) ).slice(0,3)         ; } );
        controls.add( "r",     this, function() { this.graphics_state.camera_transform = identity()                                                           ; } );
        //controls.add( "f",     this, function() { this.looking  ^=  1; } );
      },
    'update_strings'( user_interface_string_manager )   // Strings that this Scene_Component contributes to the UI:
      { 
        // var C_inv = inverse( this.graphics_state.camera_transform ), pos = mult_vec( C_inv, vec4( 0, 0, 0, 1 ) ),
        //                                                           z_axis = mult_vec( C_inv, vec4( 0, 0, 1, 0 ) );
        // user_interface_string_manager.string_map["origin" ] = "Center of rotation: " 
        //                                                       + this.origin[0].toFixed(0) + ", " + this.origin[1].toFixed(0) + ", " + this.origin[2].toFixed(0);
        // user_interface_string_manager.string_map["cam_pos"] = "Cam Position: "
        //                                                       + pos[0].toFixed(2) + ", " + pos[1].toFixed(2) + ", " + pos[2].toFixed(2);    
        // user_interface_string_manager.string_map["facing" ] = "Facing: " + ( ( z_axis[0] > 0 ? "West " : "East ")             // (Actually affected by the left hand rule)
        //                                                        + ( z_axis[1] > 0 ? "Down " : "Up " ) + ( z_axis[2] > 0 ? "North" : "South" ) );
      },
    'display'( graphics_state )
      { var leeway = 70,  degrees_per_frame = .0004 * graphics_state.animation_delta_time,
                          meters_per_frame  =   .01 * graphics_state.animation_delta_time;
        if( this.mouse.anchor )                                                         // Third-person "arcball" camera mode: Is a mouse drag occurring?
        { var dragging_vector = subtract( this.mouse.from_center, this.mouse.anchor );  // Spin the scene around the world origin on a user-determined axis.
          if( length( dragging_vector ) > 0 )
            graphics_state.camera_transform = mult( graphics_state.camera_transform,    // Post-multiply so we rotate the scene instead of the camera.
                mult( translation( this.origin ),
                mult( rotation( .05 * length( dragging_vector ), dragging_vector[1], dragging_vector[0], 0 ),
                      translation(scale_vec( -1, this.origin ) ) ) ) );
        }
        // First-person flyaround mode:  Determine camera rotation movement when the mouse is past a minimum distance (leeway) from the canvas's center.
        var offsets = { plus:  [ this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway ],
                        minus: [ this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway ] };
        if( this.looking ) 
          for( var i = 0; i < 2; i++ )      // Steer according to "mouse_from_center" vector, but don't start increasing until outside a leeway window from the center.
          { var velocity = ( ( offsets.minus[i] > 0 && offsets.minus[i] ) || ( offsets.plus[i] < 0 && offsets.plus[i] ) ) * degrees_per_frame;  // &&'s might zero these out.
            graphics_state.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), graphics_state.camera_transform );   // On X step, rotate around Y axis, and vice versa.
          }     // Now apply translation movement of the camera, in the newest local coordinate frame
        graphics_state.camera_transform = mult( translation( scale_vec( meters_per_frame, this.thrust ) ), graphics_state.camera_transform );
      }
  }, Scene_Component );

Declare_Any_Class( "Flag_Toggler",  // A class that just interacts with the keyboard and reports strings
  { 'construct'( context ) { this.globals    = context.globals; },
    'init_keys'( controls )   //  Desired keyboard shortcuts
      { controls.add( "ALT+g", this, function() { this.globals.graphics_state.gouraud       ^= 1; } );   // Make the keyboard toggle some
        controls.add( "ALT+n", this, function() { this.globals.graphics_state.color_normals ^= 1; } );   // GPU flags on and off.
        controls.add( "ALT+a", this, function() { this.globals.animate                      ^= 1; } );
      },
    'update_strings'( user_interface_string_manager )   // Strings that this Scene_Component contributes to the UI:
      { user_interface_string_manager.string_map["time"]    = "Frame Rate: " + Math.round(1000/this.globals.graphics_state.animation_delta_time ) + " fps";
        //user_interface_string_manager.string_map["fps"]     = "Frame Rate: " + (1000/this.globals.graphics_state.animation_delta_time);
        //user_interface_string_manager.string_map["animate"] = "Animation " + (this.globals.animate ? "on" : "off") ;
      },
  }, Scene_Component );
  
Declare_Any_Class( "Surfaces_Tester",
  { 'construct'( context )
      { context.globals.animate = true;
        var shapes = { 'good_sphere' : new Subdivision_Sphere( 4 ),
                       'box'         : new Cube(),
                       'strip'       : new Square(),
                       'septagon'    : new Regular_2D_Polygon(  2,  7 ),
                       'tube'        : new Cylindrical_Tube  ( 10, 10 ),
                       'open_cone'   : new Cone_Tip          (  3, 10 ),
                       'donut'       : new Torus             ( 15, 15 ),
                       'bad_sphere'  : new Grid_Sphere       ( 10, 10 ),
                       'cone'        : new Closed_Cone       ( 10, 10 ),
                       'capped'      : new Capped_Cylinder   (  4, 12 ),
                       'axis'        : new Axis_Arrows(),
                       'prism'       :     Capped_Cylinder   .prototype.auto_flat_shaded_version( 10, 10 ),
                       'gem'         :     Subdivision_Sphere.prototype.auto_flat_shaded_version(  2     ),
                       'gem2'        :     Torus             .prototype.auto_flat_shaded_version( 20, 20 ),
                       'swept_curve' : new Surface_Of_Revolution( 10, 10, 
                                            [ vec3( 2, 0, -1 ), vec3( 1, 0, 0 ), vec3( 1, 0, 1 ), vec3( 0, 0, 2 ) ], 120, [ [ 0, 7 ] [ 0, 7 ] ] ) 
                     };
        this.submit_shapes( context, shapes );
        this.define_data_members( { shader: context.shaders_in_use["Phong_Model"], textures: Object.values( context.textures_in_use ) } );
      },
    'draw_all_shapes'( model_transform, graphics_state )
      { var i = 0, t = graphics_state.animation_time / 1000;
        
        for( key in this.shapes )
        { i++;
          var funny_function_of_time = 50*t + i*i*Math.cos( t/2 ),
              random_material        = this.shader.material( Color( (i % 7)/7, (i % 6)/6, (i % 5)/5, 1 ), .2, 1, 1, 40, this.textures[ i % this.textures.length ] )
              
          model_transform = mult( model_transform, rotation( funny_function_of_time, i%3 == 0, i%3 == 1, i%3 == 2 ) );   // Irregular motion
          model_transform = mult( model_transform, translation( 0, -3, 0 ) );
          this.shapes[ key ].draw( graphics_state, model_transform, random_material );        //  Draw the current shape in the list    
        }
        return model_transform;     
      },
    'display'( graphics_state )
      { var model_transform = identity(); 
        for( var i = 0; i < 7; i++ )                                    // Another example of not every shape owning the same pair of lights:
        { 
        
          model_transform = this.draw_all_shapes( model_transform, graphics_state );      // *** How to call a function and still have a single matrix state ***
          model_transform = mult( model_transform, rotation( 360 / 13, 0, 0, 1 ) );
        }
      }
  }, Scene_Component );
  
Declare_Any_Class( "Star",    // An example of animating without making any extremely customized primitives.
  { 'construct'( context )    // Each frame manages to show one million points connected by half as many flat-colored triangles.
      { context.globals.animate = true;
        context.globals.graphics_state.animation_time = 90000;
        this.shader = context.shaders_in_use["Phong_Model"];
        var shapes = { "torus": Torus.prototype.auto_flat_shaded_version( 25, 25 ) };
        shapes.torus.indexed = false;             // Just to additionally test non-indexed shapes somewhere, use the fact that in this 
        this.submit_shapes( context, shapes );    // flat-shaded shape (no shared vertices) the index list is redundant.
      },
    'display'( graphics_state )
      { var t = graphics_state.animation_time/500,   funny_orbit = rotation(  90*t, [ Math.cos(t), Math.sin(t), .7*Math.cos(t) ] );
        
        for( var j = 0; j < 20; j++ )
          for( var i = 0; i < 20; i++ )
          {            
            var model_transform =                        rotation   ( j * 18 *                  t/60  , 0, 0, 1   );
                model_transform = mult( model_transform, rotation   ( i * 18 * Math.sin(        t/21 ), 0, 1, 0 ) );
                model_transform = mult( model_transform, translation( 2 * i  * Math.sin(        t/31 ), 0, 0    ) );
                model_transform = mult( model_transform, scale      ( 1,  1  + Math.sin( i*18 * t/41 ), 1       ) );
            
            this.shapes.torus.draw( graphics_state, model_transform, this.shader.material( Color( i/10, j/20, 0, 1 ), .2, .8, .5, 20 ) );
          }
      }
  }, Scene_Component );

Declare_Any_Class( "Bump_Map_And_Mesh_Loader",     // An example where one teapot has a bump-mapping-like hack, and the other does not.
  { 'construct'( context )
      { context.globals.animate = true;
        context.globals.graphics_state.camera_transform = translation( 0, 0, -5 );
      
        var shapes = { "teapot": new Shape_From_File( "teapot.obj" ) };
        this.submit_shapes( context, shapes );
        this.define_data_members( { stars: context.shaders_in_use["Phong_Model"  ].material( Color( .5,.5,.5,1 ), .5, .5, .5, 40, context.textures_in_use["stars.png"] ),
                                    bumps: context.shaders_in_use["Fake_Bump_Map"].material( Color( .5,.5,.5,1 ), .5, .5, .5, 40, context.textures_in_use["stars.png"] )});
      },
    'display'( graphics_state )
      { var t = graphics_state.animation_time;
        
        for( let i of [ -1, 1 ] )
        { var model_transform = mult( rotation( t/40, 0, 2, 1 ), translation( 2*i, 0, 0 ) );
              model_transform = mult( model_transform, rotation( t/25, -1, 2, 0 ) );
          this.shapes.teapot.draw( graphics_state, mult( model_transform, rotation( -90, 1, 0, 0 ) ), i == 1 ? this.stars : this.bumps );
        }
      }
  }, Scene_Component );
  
  
  // DISCLAIMER:  The collision method shown below is not used by anyone; it's just very quick to code.  Making every collision body a stretched sphere is kind 
  // of a hack, and looping through a list of discrete sphere points to see if the volumes intersect is *really* a hack (there are perfectly good analytic 
  // expressions that can test if two ellipsoids intersect without discretizing them into points).   On the other hand, for non-convex shapes you're usually going
  // to have to loop through a list of discrete tetrahedrons defining the shape anyway.
Declare_Any_Class( "Body",
  { 'construct'(s, m) { this.randomize(s, m); },
    'randomize'(s, m)
      { this.define_data_members( { shape: s, scale: [1, 1+Math.random(), 1],
                                    location_matrix: mult( rotation( 360 * Math.random(), random_vec3(1) ), translation( random_vec3(10) ) ), 
                                    linear_velocity: random_vec3(.1), 
                                    angular_velocity: .5*Math.random(), spin_axis: random_vec3(1),
                                    material: m } )
      },
    'advance'( b, time_amount )   // Do one timestep.
      { var delta = translation( scale_vec( time_amount, b.linear_velocity ) );  // Move proportionally to real time.
        b.location_matrix = mult( delta, b.location_matrix );                    // Apply translation velocity - pre-multiply to keep translations together
        
        delta = rotation( time_amount * b.angular_velocity, b.spin_axis );       // Move proportionally to real time.
        b.location_matrix = mult( b.location_matrix, delta );                    // Apply angular velocity - post-multiply to keep rotations together    
      },
    'check_if_colliding'( b, a_inv, shape )   // Collision detection function
      { if ( this == b ) return false;        // Nothing collides with itself
        var T = mult( a_inv, mult( b.location_matrix, scale( b.scale ) ) );  // Convert sphere b to a coordinate frame where a is a unit sphere
        for( let p of shape.positions )                                      // For each vertex in that b,
        { var Tp = mult_vec( T, p.concat(1) ).slice(0,3);                    // Apply a_inv*b coordinate frame shift
          if( dot( Tp, Tp ) < 1.2 )   return true;     // Check if in that coordinate frame it penetrates the unit sphere at the origin.     
        }
        return false;
      }
  });
  
Declare_Any_Class( "Simulation_Scene_Superclass",
  { 'construct'( context )
      { context.globals.animate = true;
        this.define_data_members( { bodies: [], shader: context.shaders_in_use["Phong_Model"], stars: context.textures_in_use["stars.png"] } );
        
        var shapes = { "donut"       : new Torus( 15, 15 ),
                       "cone"        : new Closed_Cone( 10, 10 ),
                       "capped"      : new Capped_Cylinder( 4, 12 ),
                       "axis"        : new Axis_Arrows(),
                       "prism"       :     Capped_Cylinder   .prototype.auto_flat_shaded_version( 10, 10 ),
                       "gem"         :     Subdivision_Sphere.prototype.auto_flat_shaded_version( 2 ),
                       "gem2"        :     Torus             .prototype.auto_flat_shaded_version( 20, 20 ) };
        this.submit_shapes( context, shapes );
      },
    'random_shape'() { return Object.values( this.shapes )[ Math.floor( 7*Math.random() ) ] },
    'random_material'() { return this.shader.material( Color( 1,Math.random(),Math.random(),1 ), .1, 1, 1, 40, this.stars ) },
    'display'( graphics_state )
      { 
                                              
        if( Math.random() < .02 ) this.bodies.splice( 0, this.bodies.length/4 ); // Sometimes we delete some so they can re-generate as new ones
        for( let b of this.bodies )
        { b.shape.draw( graphics_state, mult( b.location_matrix, scale( b.scale ) ), b.material ); // Draw each shape at its current location 
          b.advance( b, graphics_state.animation_delta_time );
        }
        this.simulate();    // This is an abstract class; call the subclass's version
      },
  }, Scene_Component );

Declare_Any_Class( "Ground_Collision_Scene",    // Scenario 1: Let random initial momentums carry bodies until they fall and bounce.
  { 'simulate'()
      { while( this.bodies.length < 100 )   this.bodies.push( new Body(this.random_shape(), this.random_material()) );      // Generate moving bodies  
        for( let b of this.bodies )
        { b.linear_velocity[1] += .0001 * -9.8;       // Gravity.
          if( b.location_matrix[1][3] < -4 && b.linear_velocity[1] < 0 ) b.linear_velocity[1] *= -.8;   // If about to fall through floor, reverse y velocity.     
        }
      }
  }, Simulation_Scene_Superclass );
 
Declare_Any_Class( "Object_Collision_Scene",    // Scenario 2: Detect when some flying objects collide with one another, coloring them red.    
  { 'simulate'()
      { if   ( this.bodies.length > 20 )       this.bodies = this.bodies.splice( 0, 20 );                                   // Max of 20 bodies
        while( this.bodies.length < 20 )       this.bodies.push( new Body(this.random_shape(), this.random_material()) );   // Generate moving bodies  
        
        if( ! this.collider ) this.collider = new Subdivision_Sphere(1);      // The collision shape should be simple
        
        for( let b of this.bodies )
        { var b_inv = inverse( mult( b.location_matrix, scale( b.scale ) ) );               // Cache b's final transform
          
          var center = mult_vec( b.location_matrix, vec4( 0, 0, 0, 1 ) ).slice(0,3);        // Center of the body
          b.linear_velocity = subtract( b.linear_velocity, scale_vec( .0003, center ) );    // Apply a small centripetal force to everything
          b.material = this.shader.material( Color( 1,1,1,1 ), .1, 1, 1, 40, this.stars );              // Default color: white
         
          for( let c of this.bodies )                                      // Collision process starts here
            if( b.check_if_colliding( c, b_inv, this.collider ) )          // Send the two bodies and the collision shape
            { b.material = this.shader.material( Color( 1,0,0,1 ), .1, 1, 1, 40, this.stars );        // If we get here, we collided, so turn red
              b.linear_velocity  = vec3();                                 // Zero out the velocity so they don't inter-penetrate more
              b.angular_velocity = 0;
            }   
        }   
      }
  }, Simulation_Scene_Superclass );