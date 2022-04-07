var sw = 20, //方块的宽
    sh = 20, //方块的高
    tr = 30, //行数
    td = 30; //列数


var snake = null;
var snakeWrapper = document.getElementById(`snakeWrap`);
var game = null;
var food = null;
var gameSpeed = 200; //贪吃蛇行进的速度与值成反比


function Square(x, y, classname) {
    this.x = x * sw;
    this.y = y * sh;
    this.class = classname;
    this.viewContent = document.createElement('div');
    this.viewContent.className = this.class;
}

Square.prototype.create = function () { //创建方块DOM，并添加到页面里
    this.viewContent.style.position = `absolute`;
    this.viewContent.style.width = sw + `px`;
    this.viewContent.style.height = sh + `px`;
    this.viewContent.style.left = this.x + `px`;
    this.viewContent.style.top = this.y + `px`;
    snakeWrapper.appendChild(this.viewContent);
};

Square.prototype.remove = function () {
    snakeWrapper.removeChild(this.viewContent);
};



// 创造一个食物
function createFood() {
    var x = null;
    var y = null;
    var inclusive = true;

    while (inclusive) {
        x = Math.round(Math.random() * (td - 1));
        y = Math.round(Math.random() * (tr - 1));

        snake.pos.forEach(function (element) {
            if (element[0] != x || element[1] != y) {
                inclusive = false;
            }
        });
    }

    food = new Square(x, y, 'food');
    food.create();
}


//创建蛇的构造函数
function Snake() {
    this.head = null;//存蛇头的信息
    this.tail = null;//存蛇尾的信息
    this.pos = [];//存蛇身上每一个方块的位置

    this.directionNum = {	//存储蛇走的方向，用一个对象来表示
        left: {
            x: -1,
            y: 0,
            rotate: 180	//蛇头在不同的方向中应该进行旋转，要不始终是向右
        },
        right: {
            x: 1,
            y: 0,
            rotate: 0
        },
        up: {
            x: 0,
            y: -1,
            rotate: -90
        },
        down: {
            x: 0,
            y: 1,
            rotate: 90
        }
    }
}

Snake.prototype.init = function () {
    let snakeHead = new Square(2, 0, 'snakeHead');
    snakeHead.create();
    this.head = snakeHead;//将蛇头信息存起来
    this.pos.push([2, 0]);//存蛇的位置

    let snakeBody1 = new Square(1, 0, 'snakeBody');
    snakeBody1.create();
    this.pos.push([1, 0]);

    let snakeBody2 = new Square(0, 0, 'snakeBody');
    snakeBody2.create();
    this.tail = snakeBody2;//将蛇头信息存起来
    this.pos.push([0, 0]);//存蛇的位置

    snakeHead.next = null;
    snakeHead.behind = snakeBody1;

    snakeBody1.next = snakeHead;
    snakeBody1.behind = snakeBody2;

    snakeBody2.next = snakeBody1;
    snakeBody2.behind = null;

    //给蛇添加一条属性，用来表示蛇走的方向
    this.direction = this.directionNum.right;	//默认让蛇往右走
};


//调用该方法来移动到下一个位置
Snake.prototype.moveNextPos = function () {
    var nextPos = [ //蛇头要走的下一个点的坐标
        this.head.x / sw + this.direction.x,
        this.head.y / sh + this.direction.y
    ]

    //下个点是自己，撞到自己游戏结束
    var selfCollapsed = false;
    this.pos.forEach(function (element) {
        if (element[0] == nextPos[0] && element[1] == nextPos[1]) {
            selfCollapsed = true;
        }
    });

    if (selfCollapsed) {
        console.log('撞到自己了!');
        this.strategies.die();
        return;
    }

    //下个点是围墙，游戏结束
    if (nextPos[0] < 0 || nextPos[1] < 0 || nextPos[0] > td - 1 || nextPos[1] > tr - 1) {
        console.log('撞墙了!');
        this.strategies.die();
        return;
    }

    //下个点食物，吃
    if (nextPos[0] == food.x / sw && nextPos[1] == food.y / sh) {
        food.remove();
        this.strategies.eat.call(this);
        createFood();
        return;
    }

    //下个点正常行走
    this.strategies.move.call(this);


}

Snake.prototype.strategies = {
    move(eatFood) {
        let newSnakeHead = new Square(this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y, 'snakeHead');
        let newSnakeBody = new Square(this.head.x / sw, this.head.y / sh, 'snakeBody');
        this.head.remove();
        newSnakeBody.create();
        newSnakeHead.viewContent.style.transform = 'rotate('+this.direction.rotate+'deg)';
        newSnakeHead.create();

        newSnakeBody.next = newSnakeHead;
        newSnakeHead.behind = newSnakeBody;
        this.head.behind.next = newSnakeBody;
        newSnakeBody.behind = this.head.behind;
        this.head = newSnakeHead;
        this.head.next = null;  //new body插入蛇头位置之后所做的指针调整
        this.pos.splice(0, 0, [this.head.x / sw, this.head.y / sh]); //更新每个蛇单元的坐标位置，以便后续行走的正确判断

        if (!eatFood) {
            this.tail.remove();
            this.tail = this.tail.next;
            this.tail.behind = null;
            this.pos.pop();
        }
    },
    eat() {
        this.strategies.move.call(this, true);
        game.score++;
    },
    die() {
        game.over();
    }
};


function Game() {
    this.timer = null;
    this.score = 0;
}

Game.prototype.init = function () {
    snake = new Snake();
    snake.init();
    createFood();
    this.start();
    document.onkeydown=function(ev){
		if(ev.which==37 && snake.direction!=snake.directionNum.right){	//用户按下左键的时候，这条蛇不能是正下往右走
			snake.direction=snake.directionNum.left;
            snake.moveNextPos();
		}else if(ev.which==38 && snake.direction!=snake.directionNum.down){
			snake.direction=snake.directionNum.up;
            snake.moveNextPos();
		}else if(ev.which==39 && snake.direction!=snake.directionNum.left){
			snake.direction=snake.directionNum.right;
            snake.moveNextPos();
		}else if(ev.which==40 && snake.direction!=snake.directionNum.up){
			snake.direction=snake.directionNum.down;
            snake.moveNextPos();
		}
	}
}

Game.prototype.start = function () {
    this.timer = setInterval(function () {
        snake.moveNextPos();
    }, gameSpeed);
}

Game.prototype.pause = function () {
    clearInterval(this.timer)
}

Game.prototype.over = function () {
    clearInterval(this.timer);
    window.alert(`你的得分为: ${this.score}`);

    snakeWrap = document.getElementById('snakeWrap');
    snakeWrap.innerHTML = '';

    snake = new Snake();
    game = new Game();

    var startBtnWrap = document.querySelector('.btnStart');
    startBtnWrap.style.display = 'block';
}


//实例化game，给玩家提供相应的接口
game = new Game();
var startBtn = document.querySelector('.btnStart button');

startBtn.onclick = function () {
    startBtn.parentNode.style.display = 'none';
    game.init();
};

var snakeWrap = document.getElementById('snakeWrap');
var pauseBtn = document.querySelector('.btnPause button');

snakeWrap.onclick = function () {
    game.pause();
    pauseBtn.parentNode.style.display = 'block';
};

pauseBtn.onclick = function () {
    game.start();
    pauseBtn.parentNode.style.display = 'none';
}



